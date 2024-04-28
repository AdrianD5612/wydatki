"use client"
import {redirect} from 'next/navigation';
import React, { useEffect } from 'react';
 
export default function RootPage() {
     
    useEffect(() => {
        let ignore = false;
        if (!ignore)  {
            if (typeof window !== 'undefined' && navigator) {
                // check and set polish or in any other case english
                let lang = navigator.language.slice(0, 2)==="pl" ? "pl" : "en";
                redirect('/'+lang);
            }
        }
        return () => { ignore = true; }
      },[]);

    return (
        <main className="flex flex-col items-center justify-center p-24 border-neutral-800 bg-zinc-800/30 from-inherit lg:static lg:w-auto lg:rounded-xl lg:border lg:p-4">
            <div className='text-center'>
                <h2 className="text-4xl font-bold">Welcome. Choose language:</h2>
                <a className="underline text-blue-500 hover:text-blue-800" href="/pl">Polish</a>
                <a className="underline text-blue-500 hover:text-blue-800 p-6" href="/en">English</a>
            </div>
        </main>
    )
}