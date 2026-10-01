import type { Metadata } from 'next';
import { Landing } from '@/components/Landing';
import HomeClient from './HomeClient';

export const metadata: Metadata = {
  title: { absolute: 'KIZZ — Өөрийгөө сорь' },
  description:
    'Тэмдэглэлээ бич, нэг товшилтоор AI-аар quiz болго, найзуудтайгаа шууд тоглож өрсөлд. Сурагч, оюутан, ажилтан, өөрөө сурч байгаа хэн бүхэнд.',
};

export default function HomePage() {
  return <HomeClient landing={<Landing />} />;
}
