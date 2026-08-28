import { LaunchIcon } from '@sanity/icons/Launch'
import { Box, Text } from '@sanity/ui'
import { useState } from 'react'
import type { DocumentActionComponent, DocumentActionProps } from 'sanity'

export const NotifyWholesaleAction: DocumentActionComponent = (
  props: DocumentActionProps,
) => {
  const [open, setOpen] = useState(false)
  const isReady = Boolean(props.published) && !props.draft

  return {
    label: 'Notify wholesale',
    icon: LaunchIcon,
    tone: 'positive',
    disabled: !isReady,
    title: isReady
      ? undefined
      : 'Publish the drop first — wholesale only sees published launches.',
    onHandle: () => {
      // Placeholder for a real integration (webhook, email, Slack, ...) — this
      // is a demo standing in for the notification step the prospect's real
      // wholesale channel would need.
      setOpen(true)
    },
    dialog: open && {
      type: 'dialog' as const,
      header: 'Wholesale notified',
      onClose: () => {
        setOpen(false)
        props.onComplete()
      },
      content: (
        <Box padding={4}>
          <Text size={2}>
            Wholesale partners have been notified that this drop is live.
          </Text>
        </Box>
      ),
    },
  }
}
