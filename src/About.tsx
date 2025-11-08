// src/About.tsx
import React from 'react';
import { useI18n } from './i18n-provider';

export default function About() {
  const { lang } = useI18n?.() || { lang: 'en' };
  const isThai = (lang || 'en').toLowerCase().startsWith('th');

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-3 text-sm leading-relaxed">
      {isThai ? (
        <>
          <p>
            “ไทยกู๊ดนิวส์” (Thai Good News)
            เป็นแอปที่ช่วยรวบรวมเสียงแห่งความหวังและพระวจนะของพระเจ้า จากแหล่งที่เชื่อถือได้ เช่น
            GRN Thailand ที่เชียงใหม่ และเครือข่าย Global Recordings Network
            ซึ่งผลิตสื่อเสียงภาษาท้องถิ่นมากมายทั่วโลก
          </p>
          <p>
            ผู้ใช้สามารถบันทึกลิงก์โปรด สร้างคิวอาร์โค้ด แชร์กับเพื่อน และเปิดฟังผ่าน
            <strong> 5fish.mobi </strong> หรือแอป <strong>5fish</strong>{' '}
            ได้อย่างสะดวกทั้งออนไลน์และออฟไลน์
          </p>
          <p>
            เราขอเชิญชวนให้คุณแบ่งปันแอปนี้กับเพื่อน พี่น้อง และครอบครัว
            เพื่อให้ข่าวดีของพระเยซูคริสต์ แผ่ไปสู่ผู้คนในทุกภาษาและทุกวัฒนธรรม
          </p>
        </>
      ) : (
        <>
          <p>
            <strong>Thai Good News</strong> is a simple bilingual PWA created to help you share
            God’s message of hope through trusted audio and story resources. It connects with
            ministries like <strong>GRN Thailand</strong> in Chiang Mai and the worldwide
            <strong> Global Recordings Network (GRN)</strong>, which produces gospel recordings in
            thousands of local languages.
          </p>
          <p>
            You can save your favorite links, create QR codes, and easily share them with others.
            Many recordings are also available through <strong>5fish.mobi</strong> or the
            <strong> 5fish app</strong> for offline listening.
          </p>
          <p>
            Please feel free to share this app with your friends and churches — every click and
            every word of encouragement helps more people hear the Good News in their own language.
          </p>
        </>
      )}
    </div>
  );
}
