import { toHostMessageSchema } from "protocol";
import uWS from "uWebSockets.js";

import { createMediasoupWorker, createWebRtcTransport } from "./mediasoup";
import { Players } from "./Players";
import { send } from "./utils/send";
import { toHex } from "./utils/toHex";

const textDecoder = new TextDecoder();
const PORT = 4000;
const cert_file_name = process.env.SSL_CERT;
const key_file_name = process.env.SSL_KEY;

// Create WebSocket server
// Use SSL if cert and key are provided
const server =
  cert_file_name && key_file_name ? uWS.SSLApp({ key_file_name, cert_file_name }) : uWS.App();

// Create Mediasoup router
const { router, webRtcServer } = await createMediasoupWorker();

// Create player manager
const players = new Players(server, router);

// Handle WebSocket connections
server.ws("/*", {
  compression: uWS.SHARED_COMPRESSOR,
  idleTimeout: 60,

  open: (ws) => {
    players.addPlayer(ws);
  },

  message: async (ws, buffer) => {
    try {
      const text = textDecoder.decode(buffer);
      const { subject, data } = toHostMessageSchema.parse(JSON.parse(text));

      switch (subject) {
        case "join": {
          players.joinSpace(ws, data.id);
          break;
        }

        case "leave": {
          players.leaveSpace(ws);
          break;
        }

        case "chat": {
          players.publishMessage(ws, data);
          break;
        }

        case "set_falling_state": {
          players.publishFallingState(ws, data);
          break;
        }

        case "set_name": {
          players.publishNickname(ws, data);
          break;
        }

        case "set_avatar": {
          players.publishAvatar(ws, data);
          break;
        }

        case "set_address": {
          players.publishAddress(ws, data);
          break;
        }

        // WebRTC
        case "get_router_rtp_capabilities": {
          send(ws, {
            subject: "router_rtp_capabilities",
            data: { rtpCapabilities: router.rtpCapabilities },
          });
          break;
        }

        case "ready_to_consume": {
          players.setReadyToConsume(ws, data);
          break;
        }

        case "resume_audio": {
          players.setAudioPaused(ws, false);
          break;
        }

        case "create_transport": {
          const { transport, params } = await createWebRtcTransport(router, webRtcServer);

          players.setTransport(ws, transport, data.type);

          const iceCandidates: any = params.iceCandidates.filter((candidate) => {
            return candidate.tcpType !== undefined;
          });

          send(ws, {
            subject: "transport_created",
            data: {
              type: data.type,
              options: {
                id: params.id,
                iceParameters: params.iceParameters,
                iceCandidates,
                dtlsParameters: params.dtlsParameters,
                sctpParameters: params.sctpParameters,
              },
            },
          });
          break;
        }

        case "connect_transport": {
          const transport =
            data.type === "producer"
              ? players.producerTransports.get(ws)
              : players.consumerTransports.get(ws);
          if (!transport) break;

          transport.connect({ dtlsParameters: data.dtlsParameters });

          break;
        }

        case "produce": {
          const id = await players.produce(ws, data.rtpParameters);

          send(ws, {
            subject: "producer_id",
            data: { id },
          });
          break;
        }

        case "produce_data": {
          if (data.sctpStreamParameters.streamId === undefined) {
            console.warn("produce_data: Stream ID is undefined");
            break;
          }

          const id = await players.produceData(ws, data.sctpStreamParameters as any);

          send(ws, {
            subject: "data_producer_id",
            data: { id },
          });
          break;
        }

        case "set_rtp_capabilities": {
          players.setRtpCapabilities(ws, data.rtpCapabilities);
          break;
        }
      }
    } catch (error) {
      console.error(error);
    }
  },

  close: (ws) => {
    players.removePlayer(ws);
  },
});

// Handle HTTP requests
server.get("/playercount/*", (res, req) => {
  const id = parseInt(req.getUrl().slice(13));
  const playerCount = players.getPlayerCount(id);

  console.info(`🔢 Player count for ${toHex(id)}: ${playerCount}`);

  res.write(String(playerCount));
  res.writeStatus("200 OK");
  res.end();
});

// Start server
server.listen(PORT, (listenSocket) => {
  if (listenSocket) console.info(`✅ Listening to port ${PORT}`);
  else console.error(`❌ Failed to listen to port ${PORT}`);
});
