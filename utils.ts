import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "./firebase";
import { toast } from "react-toastify";
import { doc, deleteDoc, onSnapshot, collection, addDoc, query, where, serverTimestamp, orderBy, Timestamp, setDoc, getDocs, getDoc, updateDoc  } from "firebase/firestore";
import { getStorage, ref, uploadBytesResumable, deleteObject, getDownloadURL } from "firebase/storage";
import db from "./firebase";
import { getTranslation } from "./translations";
import firebase from "firebase/compat/app";

const t = (lang: "en" | "pl", key: string) => getTranslation(lang, key);

export interface User {
    email: string | null,
    uid: string | null
}

export interface Expense {
	id?: string;
	name: string;
	date: firebase.firestore.Timestamp;
	amount: number;
	attachment: string;
}

export const getExpenses = (setExpenses: any, setFinished: any) => {
	try {
		const docs: Expense[] = []
		const unsub = onSnapshot(collection(db, "Expenses"), doc => {
            doc.forEach((d: any) => {
				//todo sort by date
				docs.push( { ...d.data(), id: d.id });
			});
			setExpenses(docs);
			setFinished(true);
			console.log(docs);
        });
	} catch (error) {
		console.error(error);
		setExpenses([]);
	}
}

export const uploadNewExpense = (newExpense: Expense, lang: "en" | "pl") => {
	try {
		addDoc(collection(db, "Expenses"), newExpense);
		successMessage(t(lang, "addSuccess"));
	} catch (error) {
		console.error(error);
		errorMessage(t(lang, "addFail"));
	}
}


/**
 * Displays a success message using the toast library.
 *
 * @param {string} message - The message to be displayed
 */
export const successMessage = (message:string) => {
	toast.success(message, {
		position: "top-right",
		autoClose: 5000,
		hideProgressBar: false,
		closeOnClick: true,
		pauseOnHover: true,
		draggable: true,
		progress: undefined,
		theme: "light",
	});
};
/**
 * Displays an error message using a toast notification.
 *
 * @param {string} message - The error message to be displayed
 */
export const errorMessage = (message:string) => {
	toast.error(message, {
		position: "top-right",
		autoClose: 5000,
		hideProgressBar: false,
		closeOnClick: true,
		pauseOnHover: true,
		draggable: true,
		progress: undefined,
		theme: "light",
	});
};

/**
 * Logs in the user with the provided email and password.
 *
 * @param {string} email - the user's email
 * @param {string} password - the user's password
 * @param {any} router - the router object for navigation
 */
export const LoginUser = (email: string, password: string, router: any, lang: "en" | "pl") => {
    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            successMessage(t(lang, "loginSuccess"));
            router.push("/"+lang);
        })
        .catch((error) => {
            console.error(error);
            errorMessage(t(lang, "loginFail"));
        });
};

/**
 * Logs the user out and navigates to the login page.
 *
 * @param {any} router - the router object for navigation
 */
export const LogOut = (router: any, lang: "en" | "pl") => {
	signOut(auth)
		.then(() => {
			successMessage(t(lang, "logoutSuccess"));
			router.push("/login");
		})
		.catch((error) => {
			errorMessage(t(lang, "logoutFail"));
		});
};