import { useParams } from '@remix-run/react'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { z } from 'zod'

const projectSchema = z.array(
  z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    href: z.string().optional(),
    img: z.string().optional(),
    type: z.array(z.string()),
  })
)

export function useEcosystemQuery() {
  const { tab: currentTab } = useParams<{ tab: string }>()

  const { data, isLoading } = useQuery({
    queryKey: ['ecosystem'],
    queryFn: async () => {
      return fetch(
        window.env.UMBRACO_URL + '/umbraco/api/ecosystem/getallprojects'
      )
        .then((res) => res.json())
        .then((projects) => projectSchema.parse(projects))
    },
    staleTime: Infinity,
    gcTime: Infinity,
  })

  const items = useMemo(() => {
    if (!data) return []

    if (!currentTab)
      return data.map((item) => ({
        id: item.id,
        name: item.name,
        href: item.href,
        img: item.img,
        description: item.description,
      }))

    const currentTabName = currentTab.toLowerCase()
    return data
      .filter((item) => item.type.find((type) => type == currentTabName))
      .map((item) => ({
        id: item.id,
        name: item.name,
        href: item.href,
        img: item.img,
        description: item.description,
      }))
  }, [currentTab, data])

  return items
}
