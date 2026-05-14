"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Sparkles, X } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function ProfileSetupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  function handleAvatarChange(file: File | undefined) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please choose an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Please choose an image smaller than 5MB.");
      return;
    }

    setAvatarFile(file);
    setAvatarPreviewUrl(URL.createObjectURL(file));
  }

  function clearAvatar() {
    setAvatarFile(null);

    if (avatarPreviewUrl) {
      URL.revokeObjectURL(avatarPreviewUrl);
    }

    setAvatarPreviewUrl(null);
  }

  async function uploadAvatar(userId: string) {
    if (!avatarFile) return null;

    const fileExtension = avatarFile.name.split(".").pop() || "jpg";
    const filePath = `${userId}/avatar.${fileExtension}`;

    const { error } = await supabase.storage
      .from("avatars")
      .upload(filePath, avatarFile, {
        upsert: true,
      });

    if (error) {
      throw new Error(error.message);
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);

    return data.publicUrl;
  }

  async function saveProfile() {
    if (isSaving) return;

    setIsSaving(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        alert("Please log in first.");
        router.push("/login");
        return;
      }

      const avatarUrl = await uploadAvatar(user.id);

      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        username: username.trim() || null,
        bio: bio.trim() || null,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        throw new Error(error.message);
      }

      router.push("/crew/setup");
      router.refresh();
    } catch (error) {
      setIsSaving(false);
      alert(
        error instanceof Error
          ? error.message
          : "Something went wrong saving your profile."
      );
    }
  }

  function skipForNow() {
    router.push("/crew/setup");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#09090f] px-6 py-8 text-white">
      <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-gradient-to-b from-[#17172b] to-black p-6 shadow-2xl">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-fuchsia-500/20">
          <Sparkles className="h-8 w-8 text-fuchsia-300" />
        </div>

        <p className="text-xs uppercase tracking-[0.4em] text-fuchsia-300">
          Profile setup
        </p>

        <h1 className="mt-2 text-4xl font-black">Make it yours</h1>

        <p className="mt-3 text-white/50">
          Add a username, photo, and tiny bio so ZOO feels like your space.
        </p>

        <div className="mt-8 space-y-5">
          <div className="text-center">
            {avatarPreviewUrl ? (
              <div className="relative mx-auto h-28 w-28 overflow-hidden rounded-full border border-white/10">
                <Image
                  src={avatarPreviewUrl}
                  alt="Avatar preview"
                  width={240}
                  height={240}
                  className="h-full w-full object-cover"
                  unoptimized
                />

                <button
                  onClick={clearAvatar}
                  className="absolute right-1 top-1 flex h-8 w-8 items-center justify-center rounded-full bg-black/70"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="mx-auto flex h-28 w-28 cursor-pointer flex-col items-center justify-center rounded-full border border-dashed border-white/20 bg-white/[0.04]">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) =>
                    handleAvatarChange(event.target.files?.[0])
                  }
                />
                <Camera className="h-7 w-7 text-cyan-200" />
                <span className="mt-2 text-xs text-white/40">Add photo</span>
              </label>
            )}
          </div>

          <input
            value={username}
            onChange={(event) => setUsername(event.target.value.slice(0, 24))}
            placeholder="Username"
            className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-4 text-white outline-none placeholder:text-white/30"
          />

          <textarea
            value={bio}
            onChange={(event) => setBio(event.target.value.slice(0, 120))}
            placeholder="Short bio"
            className="min-h-24 w-full resize-none rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-4 text-white outline-none placeholder:text-white/30"
          />

          <button
            onClick={saveProfile}
            disabled={isSaving}
            className="w-full rounded-2xl bg-fuchsia-500 px-5 py-4 font-bold shadow-[0_0_30px_rgba(217,70,239,0.35)] disabled:opacity-40"
          >
            {isSaving ? "Saving..." : "Save profile"}
          </button>

          <button
            onClick={skipForNow}
            className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 font-bold text-white/70"
          >
            Skip for now
          </button>
        </div>
      </div>
    </main>
  );
}