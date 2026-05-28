import { AppSidebar } from 'shared/components/layouts/app-sidebar'
import { Separator } from 'shared/components/ui/separator'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from 'shared/components/ui/sidebar'

export default function Page() {
  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': '19rem',
        } as React.CSSProperties
      }
    >
      <AppSidebar />
      <SidebarInset>
        <main className="px-4">
          <header className="flex h-16 shrink-0 items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="my-auto mr-1.5 h-4" />
            <p>Hello world</p>
          </header>
          <section>this is perfect</section>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
