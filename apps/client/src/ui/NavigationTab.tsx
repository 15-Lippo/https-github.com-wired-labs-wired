import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

interface Props {
  href: string;
  text: string;
}

export default function NavigationTab({ href, text }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState(false);

  useEffect(() => {
    if (href === "/") {
      setSelected(router.asPath === "/");
      return;
    }

    setSelected(router.asPath == href);
  }, [router, href]);

  const selectedClass = selected ? "bg-neutral-200" : "hover:bg-neutral-200";

  return (
    <div className="w-full md:w-min">
      <Link href={href}>
        <div
          className={`flex cursor-pointer justify-center rounded-lg py-1 text-lg font-bold transition md:px-20 ${selectedClass}`}
        >
          {text}
        </div>
      </Link>
    </div>
  );
}
