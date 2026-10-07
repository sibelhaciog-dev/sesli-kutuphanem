import type { Metadata } from 'next'
import { FeedbackForm } from '@/components/community/FeedbackForm'
import { SITE_NAME } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Görüş bildir',
  description: `${SITE_NAME} hakkında görüş ve önerilerinizi paylaşın.`,
}

export default function FeedbackPage() {
  return <FeedbackForm />
}
