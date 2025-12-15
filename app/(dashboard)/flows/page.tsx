'use client'

import { FlowSubmissionsView } from '@/components/features/flows/FlowSubmissionsView'
import { useFlowSubmissionsController } from '@/hooks/useFlowSubmissions'

export default function FlowsPage() {
  const controller = useFlowSubmissionsController()

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-white">Flows</h1>
        <p className="text-sm text-gray-400">
          Submissões recebidas via webhook (WhatsApp Flows sem endpoint).
        </p>
      </div>

      <FlowSubmissionsView
        submissions={controller.submissions}
        isLoading={controller.isLoading}
        isFetching={controller.isFetching}
        phoneFilter={controller.phoneFilter}
        onPhoneFilterChange={controller.setPhoneFilter}
        flowIdFilter={controller.flowIdFilter}
        onFlowIdFilterChange={controller.setFlowIdFilter}
        onRefresh={() => controller.refetch()}
      />
    </div>
  )
}
