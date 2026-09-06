"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { inquiryStatuses, type InquiryFormState } from "@/lib/inquiries";

export async function updateInquiry(_previous: InquiryFormState, formData: FormData): Promise<InquiryFormState> {
  await requireAdmin();
  const parsed = z.object({ id: z.string().min(1), updatedAt: z.iso.datetime(), status: z.enum(inquiryStatuses), notes: z.string().trim().max(5000) }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Check the status and notes (maximum 5,000 characters)." };
  try {
    const { id, updatedAt, ...data } = parsed.data;
    const result = await prisma.inquiry.updateMany({ where: { id, updatedAt: new Date(updatedAt) }, data });
    if (!result.count) return { error: "This inquiry was changed by another administrator. Reload the page before saving." };
    revalidatePath("/admin/inquiries");
    revalidatePath(`/admin/inquiries/${id}`);
    revalidatePath("/admin");
    return { success: true };
  } catch { return { error: "Unable to save changes. Please try again." }; }
}
