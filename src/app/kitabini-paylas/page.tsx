import type { Metadata } from 'next'
import { SponsorApplicationForm } from '@/components/community/SponsorApplicationForm'
import { istanbulToday, upcomingMonths } from '@/lib/sponsorship'

export const metadata: Metadata = {
  title: 'Ayın kitabı sponsorluğu',
  description:
    'Yayınevi ya da yazar mısınız? Kitabınız sitemizde “Ayın kitabı” olarak ailelere ulaşsın.',
}

export default function ShareYourBookPage() {
  return <SponsorApplicationForm months={upcomingMonths(istanbulToday(), 6)} />
}
