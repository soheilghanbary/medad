'use client'
import { useMutation } from '@tanstack/react-query'
import { FileTextIcon, PlusIcon } from 'lucide-react'
import type * as React from 'react'
import { client } from 'server/lib/orpc.client'
import { Button } from 'shared/components/ui/button'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuSubButton,
} from 'shared/components/ui/sidebar'

const dataPages = [
  {
    name: 'English Learning',
    href: '/dashboard/english-learning',
  },
  {
    name: 'Math Learning',
    href: '/dashboard/math-learning',
  },
  {
    name: 'Science Learning',
    href: '/dashboard/science-learning',
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { mutate } = useMutation(client.page.create.mutationOptions())
  return (
    <Sidebar variant="floating" {...props}>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu className="gap-2">
            <SidebarMenuItem className="flex items-center">
              Pages
              <Button
                size={'icon'}
                variant={'ghost'}
                className={'ml-auto'}
                onClick={() => mutate()}
              >
                <PlusIcon className="size-5" />
              </Button>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarMenu className="gap-2">
            {dataPages.map((page) => (
              <SidebarMenuItem key={page.name}>
                <SidebarMenuSubButton>
                  <FileTextIcon className="text-muted-foreground!" />
                  {page.name}
                </SidebarMenuSubButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
