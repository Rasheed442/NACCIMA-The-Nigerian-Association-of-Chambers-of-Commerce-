'use client';

import VettingReviewPage from '@/app/vetting-review/[id]/page';

export default function AdminApplicationReviewPage() {
  return (
    <VettingReviewPage
      role="admin"
      backHref="/admin/my-applications"
      backLabel="Back to Applications"
      logoutHref="/"
    />
  );
}
