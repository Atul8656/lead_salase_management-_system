"use client";

import { useEffect, useState } from "react";
import type { User } from "@/lib/types";
import { userFirstInitial } from "@/lib/userDisplay";

type Props = {
  user: User | null;
  loading: boolean;
  sizeClass?: string;
  textClass?: string;
};

export default function UserAvatar({
  user,
  loading,
  sizeClass = "h-10 w-10",
  textClass = "text-sm",
}: Props) {
  const url = user?.avatar_url?.trim();
  const [imgErr, setImgErr] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(url);

  if (url !== currentUrl) {
    setCurrentUrl(url);
    setImgErr(false);
  }

  const letterBubble = `flex ${sizeClass} shrink-0 items-center justify-center rounded-full bg-neutral-900 font-bold text-white ring-1 ring-neutral-200 ${textClass}`;

  if (loading) {
    return (
      <span className={letterBubble} aria-hidden>
        …
      </span>
    );
  }

  if (url && !imgErr) {
    return (
      <img
        src={url}
        alt=""
        className={`${sizeClass} shrink-0 rounded-full object-cover ring-1 ring-neutral-200`}
        onError={() => setImgErr(true)}
      />
    );
  }

  return (
    <span className={letterBubble} aria-hidden>
      {userFirstInitial(user?.full_name ?? "")}
    </span>
  );
}
