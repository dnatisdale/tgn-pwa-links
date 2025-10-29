// src/About.tsx
import React from 'react';
import type { Lang } from './i18n-provider';

export default function About({ lang }: { lang: Lang }) {
  return (
    <div className="max-w-2xl mx-auto p-3 space-y-3 text-sm">
      {lang === 'th' ? (
        <>
          <h1 className="text-lg font-semibold">เกี่ยวกับ Thai Good News</h1>
          <p>แอปนี้ช่วยรวมลิงก์ข่าวดีและทรัพยากรภาษา (QR & ลิงก์) ให้ใช้งานได้ง่ายบนมือถือ</p>
          <p>ติดต่อ: ใส่อีเมล/เว็บไซต์ของคุณที่นี่</p>
        </>
      ) : (
        <>
          <h1 className="text-lg font-semibold">About Thai Good News</h1>
          <p>
            This app collects “good news” links/resources (with QR & direct links) and makes them
            easy to share on any device.
          </p>
          <p>Contact: put your email/website here.</p>
        </>
      )}
    </div>
  );
}
