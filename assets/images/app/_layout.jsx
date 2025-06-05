import { Slot, Stack } from "expo-router";
import { AppProvider } from '@/app-context'
import Edit from "@/app/children/edit_profile";

export default function RootLayout() {
  return (
    <AppProvider>
      <Slot/> 
    </AppProvider>
    )
}
