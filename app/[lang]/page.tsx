"use client"
import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/firebase';
import { onAuthStateChanged } from "firebase/auth";
import { User, Expense, getPermissions, getExpenses, uploadNewExpense, uploadFile, deleteExpense, updateExpense, generateUrlFromStorage, deleteAttachment, importFromFile, LogOut } from '@/utils';
import { getTranslation } from '@/translations';
import { Timestamp } from "firebase/firestore";

export type Props = {
  params: { [lang: string]: "en" | "pl" };
};

export default function Home({ params: { lang } }: Props) {
  const inputClass = "w-16 text-white bg-zinc-400/30";
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[] | []>([]);
  const [finished, setFinished] = useState(false);
  const [modifyPermission, setModifyPermission] = useState(false);
  const [newMode, setNewMode] = useState(false);
  const [newExpense, setNewExpense] = useState<Expense>({name: "", date: Timestamp.fromDate(new Date()), amount: 0, attachment: ""});
  const [newFile, setNewFile] = useState<File>();
  const [importMode, setImportMode] = useState(false);
  const [viewUrl, setViewUrl] = useState<string>();
  const [showImg, setShowImg] = useState(false);
  const t = (key: string) => getTranslation(lang, key);
  const [user, setUser] = useState<User>();
  const isUserLoggedIn = useCallback(() => {
		onAuthStateChanged(auth, async (user) => {
      if (user) {
          setUser({ email: user.email, uid: user.uid });
          getPermissions(user.uid, setModifyPermission);
			} else {
          let language;
          if (typeof window !== 'undefined' && navigator) {
            // check and set polish or in any other case english
            language = navigator.language.slice(0, 2)==="pl" ? "pl" : "en";
          } else {
            // in server-side case set lang to english
            language = "en";
          }
				return router.push("/"+language+"/login");
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
  }

  const prepareUploadFile = (file: File| undefined) => {
    if (file != undefined) {
      setNewFile(file);
    }
  }

  const viewClicked = (id: string) => {
    if (id) {
      generateUrlFromStorage(id, setViewUrl, lang);
      setShowImg(true);
    }
  }
  

  useEffect(() => {
    isUserLoggedIn()
  }, [isUserLoggedIn]);

  useEffect(() => {
    let ignore = false;
    if (!ignore)  {
      getExpenses(setExpenses,setFinished)
    }
    return () => { ignore = true; }
  },[]);

if (!finished) return  <div className="flex justify-center border-b border-neutral-800 bg-gradient-to-b from-zinc-600/30 pb-6 pt-8 backdrop-blur-2xl lg:static lg:w-auto lg:rounded-xl lg:p-4">...</div>
return (
    <main className="flex flex-col items-center justify-center p-24 border-neutral-800 bg-zinc-800/30 from-inherit lg:static lg:w-auto lg:rounded-xl lg:border lg:p-4">
      {showImg &&
      <div id="lightbox">
        <img src={viewUrl} alt={t("attachment")} onClick={() => setShowImg(false)} />
        </div>
      }
      <div style={{
        display: modifyPermission? (newMode? "none":"block") : "none"
      }}>
        <button className="p-3 bg-blue-600 hover:bg-blue-800 text-white" onClick={() => createNewClicked()}>{t("createExpense")}</button>
        <button className="p-3 bg-yellow-600 hover:bg-yellow-800 text-white" hidden={importMode} onClick={() => setImportMode(true)}>{t("import")}</button>
      </div>
      <div className="mt-2 items-center justify-end" style={{
        display: modifyPermission? (newMode? "block":"none") : "none"
      }}>
        <div><input 
          type="text"
          className="w-16 md:w-32 lg:w-32 text-white bg-zinc-400/30"
          placeholder={t("name")}
          value={newExpense?.name}
          onChange={e => setNewExpense({...newExpense, name: e.target.value})}
        /></div>
        <div><input
          type="date"
          className="w-16 md:w-32 lg:w-32 text-white bg-zinc-400/30"
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
      <div className="mt-2 items-center justify-end" style={{
        display: importMode? "block" : "none"
      }}>
        <input
          type="file"
          name="file"
          className="block w-full mb-5 text-xs border rounded-lg cursor-pointer text-gray-400 focus:outline-none bg-gray-700 border-gray-600 placeholder-gray-400"
          onChange={e => importFromFile(e.target.files?.[0], setImportMode, lang)}
          />
      </div>
      <div className="mt-2 max-w-5xl w-full from-black via-black items-center justify-center font-mono text-sm flex">
        <table className="text-white">
          <thead>
            <tr>
              <th>{t("name")}</th>
              <th>{t("date")}</th>
              <th>{t("amount")}</th>
              <th>{t("balance")}</th>
              <th>{t("attachment")}</th>
              {modifyPermission &&
              <th>{t("edit")}</th>
              }
            </tr>
          </thead>
          <tbody>
          {expenses?.map((expense: Expense) =>(
            <tr className={expense.amount>0? "bg-green-900" : "bg-red-900"} key={expense.id}>
              <td>
                <input 
                type="text"
                className="w-16 md:w-40 lg:w-60 text-xs md:text-sm text-white bg-transparent"
                value={expense.name}
                readOnly={!expense.editMode}
                onChange={(e) => {
                  setExpenses((prevExpenses: any) =>
                    prevExpenses.map((prevExpense: Expense) =>
                      prevExpense.id === expense.id ? { ...prevExpense, name: e.target.value } : prevExpense
                    )
                  );
                }}/>
                </td>
              <td>
                <input
                type="date"
                className="w-24 md:w-28 text-xs md:text-sm text-white bg-transparent"
                value={expense.date.toDate().toLocaleDateString('en-CA')}
                readOnly={!expense.editMode}
                onChange={(e) => {
                  setExpenses((prevExpenses: any) =>
                    prevExpenses.map((prevExpense: Expense) =>
                      prevExpense.id === expense.id ? { ...prevExpense, date: Timestamp.fromDate(new Date(e.target.value)) } : prevExpense
                    )
                  );
                }}
                />
              </td>
              <td>
                <input
                type="number"
                className="w-16 text-xs md:text-sm text-white bg-transparent"
                value={expense.amount}
                readOnly={!expense.editMode}
                onChange={(e) => {
                  setExpenses((prevExpenses: any) =>
                    prevExpenses.map((prevExpense: Expense) =>
                      prevExpense.id === expense.id ? { ...prevExpense, amount: Number(e.target.value) } : prevExpense
                    )
                  );
                }}
                />
              </td>
              <td className={'text-xs md:text-sm'+(expense.balance && expense.balance>0? " bg-green-900" : " bg-red-900")}>{expense.editMode? '' : expense.balance}</td>
              <td className='text-xs md:text-sm'>
                {expense.attachment? (
                  <><button className="p-3 w-auto bg-blue-600 hover:bg-blue-800 text-white" hidden={expense.editMode} onClick={() => viewClicked(expense.attachment as string)}>{t("view")}</button>
                    <button className="p-3 w-auto bg-red-600 hover:bg-red-800 text-white" hidden={!expense.editMode} onClick={() => deleteAttachment(expense.id as string, expense.attachment as string, lang)}>{t("deleteAttachment")}</button></>
                  ) : (
                  <input
                  type={expense.editMode? "file": "hidden" }
                  name="file"
                  className="block w-full mb-5 text-xs border rounded-lg cursor-pointer text-gray-400 focus:outline-none bg-gray-700 border-gray-600 placeholder-gray-400"
                  onChange={e => { if (e.target.files?.[0]) uploadFile(e.target.files?.[0], expense.id as string, lang)}}
                  />
                  )
                }
              </td>
              {modifyPermission &&
              <td className='text-xs md:text-sm flex space-x-2'>
                <button className="p-3 bg-blue-600 hover:bg-blue-800 text-white" onClick={() => {
                setExpenses((prevExpenses: any) =>
                    prevExpenses.map((prevExpense: Expense) =>
                      prevExpense.id === expense.id ? { ...prevExpense, editMode: !prevExpense.editMode } : prevExpense
                    )
                  );
                }}>{t("edit")}</button>
                <button className="p-3 bg-green-600 hover:bg-green-800 text-white" hidden={!expense.editMode} onClick={() => updateExpense(expense, lang)}>{t("save")}</button>
                <button className="p-3 bg-red-600 hover:bg-red-800 text-white" hidden={!expense.editMode} onClick={() => {
                  const isConfirmed = confirm(t("confirmDelete"))
                  if (isConfirmed && expense.id) {
                    deleteExpense(expense.id, lang);
                  }
                }}>{t("delete")}</button>
              </td>
              }
            </tr>
          ))}
          </tbody>
        </table>
      </div>
      <div>
        <button className="p-3 bg-red-500 hover:bg-red-600" onClick={() => LogOut(router, lang)}>{t("logOut")}</button>
      </div>
    </main>
  );
}
