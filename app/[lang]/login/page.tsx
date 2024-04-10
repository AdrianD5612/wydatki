"use client"
import { LoginUser } from "@/utils"
import React, { FormEventHandler, useState } from "react"
import { useRouter } from 'next/navigation'
import { getTranslation } from '@/translations';
import { Props } from "@/app/[lang]/page"

export default function Home({ params: { lang } }: Props) {
  const [email, setEmail] = useState<string>("")
  const [password, setPassword] = useState<string>("")
  const router = useRouter()
  const t = (key: string) => getTranslation(lang, key);
  
  const handleSubmit: FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault()
    LoginUser(email, password, router, lang)
  }
  
  return (
    <main className="w-full bg-slate-800 h-[90vh] flex items-center justify-center flex-col px-4"> 
      <h2 className="text-3xl text-white font-bold mb-6">{t("login")}:</h2>
      <form className="flex text-white  flex-col md:w-1/2 w-full mb-8" onSubmit={handleSubmit}>
        <label htmlFor="email">{t("email")}</label>
        <input type="email" name="email" id="email"
          className="border-[1px] py-2 px-4 rounded mb-4 text-black" required
          value={email}
          onChange={e => setEmail(e.target.value)} 
          placeholder="demo@user.com"
        />
        <label htmlFor="password">{t("password")}</label>
        <input type="password" name="password" id="password" required
          className="border-[1px] py-2 px-4 rounded  mb-4 text-black"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="demoUser"
        /> 
        <button type="submit" className="p-3 bg-blue-600 hover:bg-blue-800 text-white md:w-[200px] w-full rounded">{t("submitLogin")}</button>
      </form>
      </main>
  )
}