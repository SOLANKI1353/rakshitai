
'use server';
import { redirect } from 'next/navigation';

export async function runCodeInAiCoder(code: string, lang: string) {
    const url = `/ai-coder?code=${encodeURIComponent(code)}&lang=${lang}`;
    redirect(url);
}

    