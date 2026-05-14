"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, ImagePlus, Send, X } from "lucide-react";
import { MobileShell } from "@/components/zoo/mobile-shell";
import { createClient } from "@/utils/supabase/client";

export default function CreatePage() {
  const router = useRouter();
  const supabase = createClient();

  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);

  const remaining = 250 - content.length;

  function handleImageChange(file: File | undefined) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please choose an image file.");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      alert("Please choose an image smaller than 8MB.");
      return;
    }

    setImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
  }

  function clearImage() {
    setImageFile(null);

    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }

    setImagePreviewUrl(null);
  }

  async function uploadImage() {
    if (!imageFile) return null;

    const fileExtension = imageFile.name.split(".").pop() || "jpg";
    const fileName = `${crypto.randomUUID()}.${fileExtension}`;
    const filePath = `posts/${fileName}`;

    const { error } = await supabase.storage
      .from("post-images")
      .upload(filePath, imageFile);

    if (error) {
      throw new Error(error.message);
    }

    const { data } = supabase.storage
      .from("post-images")
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  async function submitPost() {
    if ((!content.trim() && !imageFile) || isPosting) return;

    setIsPosting(true);

    try {
      const imageUrl = await uploadImage();

      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
          imageUrl,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();

        setIsPosting(false);

        alert(errorData.error || "Something went wrong creating your post.");

        return;
      }

      setContent("");
      clearImage();

      router.push("/feed");
      router.refresh();
    } catch (error) {
      setIsPosting(false);

      alert(
        error instanceof Error
          ? error.message
          : "Something went wrong uploading your image."
      );
    }
  }

  return (
    <MobileShell activeTab="create">
      <header className="border-b border-white/10 px-5 py-5">
        <p className="text-xs uppercase tracking-[0.4em] text-fuchsia-300">
          Create
        </p>

        <h1 className="text-2xl font-black">Post anything</h1>

        <p className="mt-1 text-sm text-white/50">
          No judgment. Just your AI crew.
        </p>
      </header>

      <div className="space-y-5 px-5 py-6">
        <div>
          <textarea
            value={content}
            onChange={(event) =>
              setContent(event.target.value.slice(0, 250))
            }
            maxLength={250}
            placeholder="Add a caption or just post the photo..."
            className="min-h-32 w-full resize-none rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-lg text-white outline-none placeholder:text-white/30"
          />

          <p
            className={`mt-2 text-right text-xs ${
              remaining < 30 ? "text-fuchsia-300" : "text-white/40"
            }`}
          >
            {remaining} characters left
          </p>
        </div>

        {imagePreviewUrl ? (
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]">
            <button
              onClick={clearImage}
              className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-white"
              aria-label="Remove image"
            >
              <X className="h-4 w-4" />
            </button>

            <Image
              src={imagePreviewUrl}
              alt="Selected post image"
              width={800}
              height={800}
              className="max-h-[420px] w-full object-cover"
              unoptimized
            />
          </div>
        ) : (
          <label className="block cursor-pointer rounded-3xl border border-dashed border-white/20 bg-white/[0.03] p-6 text-center">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) =>
                handleImageChange(event.target.files?.[0])
              }
            />

            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/10">
              <ImagePlus className="h-7 w-7 text-cyan-200" />
            </div>

            <p className="font-bold">Add one image</p>

            <p className="mt-1 text-sm text-white/40">
              Pick a selfie, photo, meme, or wedding moment.
            </p>
          </label>
        )}

        <div className="grid grid-cols-2 gap-3">
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 font-semibold">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) =>
                handleImageChange(event.target.files?.[0])
              }
            />

            <ImagePlus className="h-4 w-4" />
            Upload
          </label>

          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 font-semibold">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(event) =>
                handleImageChange(event.target.files?.[0])
              }
            />

            <Camera className="h-4 w-4" />
            Camera
          </label>
        </div>

        <button
          onClick={submitPost}
          disabled={(!content.trim() && !imageFile) || isPosting}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-fuchsia-500 px-5 py-4 font-bold shadow-[0_0_30px_rgba(217,70,239,0.35)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Send className="h-4 w-4" />

          {isPosting ? "Posting..." : "Post to my crew"}
        </button>
      </div>
    </MobileShell>
  );
}