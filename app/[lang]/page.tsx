"use client"
import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/firebase';
import { onAuthStateChanged } from "firebase/auth";
import { User, Expense, getExpenses, uploadNewExpense, uploadFile } from '@/utils';
import { getTranslation } from '@/translations';
import firebase from 'firebase/compat/app';
import { Timestamp } from "firebase/firestore";

export type Props = {
  params: { [lang: string]: "en" | "pl" };
};

export default function Home({ params: { lang } }: Props) {
  const inputClass = "w-16 text-white bg-zinc-400/30";
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[] | []>([]);
  const [finished, setFinished] = useState(false);
  const [newMode, setNewMode] = useState(false);
  const [newExpense, setNewExpense] = useState<Expense>({name: "", date: Timestamp.fromDate(new Date()), amount: 0, attachment: ""});
  const [newFile, setNewFile] = useState<File>();
  const t = (key: string) => getTranslation(lang, key);
  const [user, setUser] = useState<User>();
  const isUserLoggedIn = useCallback(() => {
		onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUser({ email: user.email, uid: user.uid });
                const promises = [getExpenses(setExpenses,setFinished)];
                await Promise.all(promises);
			} else {
				return router.push("/"+lang+"/login");
			}
		});
	}, [router]);

  const createNewClicked = () => {
    setNewMode(true);
    setNewExpense({name: "", date: Timestamp.fromDate(new Date()), amount: 0, attachment: ""});
    setNewFile(undefined);
  }

  const submitClicked = () => {
    setNewMode(false);
    uploadNewExpense(newExpense, newFile, lang);
    setExpenses([...expenses, newExpense]);
  }

  const prepareUploadFile = (file: File| undefined) => {
    if (file != undefined) {
      setNewFile(file);
    }
  }

  useEffect(() => {
    isUserLoggedIn()
}, [isUserLoggedIn]);

if (!finished) return  <div className="flex justify-center border-b border-neutral-800 bg-gradient-to-b from-zinc-600/30 pb-6 pt-8 backdrop-blur-2xl lg:static lg:w-auto lg:rounded-xl lg:p-4">...</div>
return (
    <main className="flex flex-col items-center justify-center p-24 border-neutral-800 bg-zinc-800/30 from-inherit lg:static lg:w-auto lg:rounded-xl lg:border lg:p-4">
      <div style={{
        display: newMode? "none":"block"
      }}>
        <button className="p-3 bg-blue-600 hover:bg-blue-800 text-white" onClick={() => createNewClicked()}>{t("createExpense")}</button>
      </div>
      <div className="mt-2 items-center justify-end" style={{
        display: newMode? "block":"none"
      }}>
        <div><input 
          type="text"
          className={inputClass}
          placeholder={t("name")}
          value={newExpense?.name}
          onChange={e => setNewExpense({...newExpense, name: e.target.value})}
        /></div>
        <div><input
          type="date"
          className="w-32 text-white bg-zinc-400/30"
          value={newExpense?.date?.toDate().toLocaleDateString('en-CA')}
          onChange={e => setNewExpense({...newExpense, date: Timestamp.fromDate(new Date(e.target.value))})}
        /></div>
        <div><input
          type="number"
          className={inputClass}
          value={newExpense?.amount}
          onChange={e => setNewExpense({...newExpense, amount: Number(e.target.value)})}
        /></div>
        <div><input
          type="file"
          name="file"
          className="block w-full mb-5 text-xs border rounded-lg cursor-pointer text-gray-400 focus:outline-none bg-gray-700 border-gray-600 placeholder-gray-400"
          onChange={e => prepareUploadFile(e.target.files?.[0])}
          /></div>
        <div><button className="mt-2 p-3 bg-green-600 hover:bg-green-800 text-white md:w-[200px] w-full rounded" onClick={() => submitClicked()}>{t("addExpense")}</button></div>
        <div><button className="mt-2 p-3 bg-red-600 hover:bg-red-800 text-white md:w-[200px] w-full rounded" onClick={() => setNewMode(false)}>{t("cancel")}</button></div>
      </div>
      <div className="mt-2 max-w-5xl w-full from-black via-black items-center justify-center font-mono text-sm flex">
        <table className="text-white">
          <thead>
            <tr>
              <th>{t("name")}</th>
              <th>{t("date")}</th>
              <th>{t("amount")}</th>
              <th>{t("attachment")}</th>
              <th>{t("edit")}</th>
            </tr>
          </thead>
          <tbody>
          {expenses?.map((expense: Expense, i) =>(
            <tr key={expense.id}>
              <td className='md:text-md text-sm'>
                <input 
                type="text"
                className={inputClass}
                value={expense.name}
                disabled={!expense.editMode}
                onChange={(e) => {
                  setExpenses((prevExpenses: any) =>
                    prevExpenses.map((prevExpense: Expense) =>
                      prevExpense.id === expense.id ? { ...prevExpense, name: e.target.value } : prevExpense
                    )
                  );
                }}/>
                </td>
              <td className='md:text-md text-sm'>{expense.date.toDate().toLocaleDateString('en-CA')}</td>
              <td className='md:text-md text-sm'>{expense.amount}</td>
              <td className='md:text-md text-sm'>FileID:{expense.attachment}</td>
              <td className='md:text-md text-sm'><button className="p-3 bg-blue-600 hover:bg-blue-800 text-white" onClick={() => {
                setExpenses((prevExpenses: any) =>
                    prevExpenses.map((prevExpense: Expense) =>
                      prevExpense.id === expense.id ? { ...prevExpense, editMode: !prevExpense.editMode } : prevExpense
                    )
                  );
                }}>{t("edit")}</button></td>
            </tr>
          ))}
          </tbody>
        </table>
      </div>
      
    </main>
  );
}
