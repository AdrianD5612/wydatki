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
	attachment?: string;
	editMode?: boolean; // used only on client side to handle editing
}

export const getPermissions = (id: string, setModifyPermission: any) => {
	try {
		const unsub = onSnapshot(collection(db, "Permissions"), doc => {
            doc.forEach((d: any) => {
				if (d.data().id === id) {
					setModifyPermission(true);
				}
			});
		});
	} catch (error) {
		console.error(error);
		setModifyPermission(false);
	}
}

export const getExpenses = (setExpenses: any, setFinished: any) => {
	try {
		const docs: Expense[] = []
		const unsub = onSnapshot(collection(db, "Expenses"), doc => {
            doc.forEach((d: any) => {
				docs.push( { ...d.data(), id: d.id });	
			});
			docs.sort((a:Expense, b:Expense) => a.date.toMillis() - b.date.toMillis());
			setExpenses(docs);
			setFinished(true);
        });
	} catch (error) {
		console.error(error);
		setExpenses([]);
	}
}

export const uploadNewExpense = async (newExpense: Expense, file: File | undefined, lang: "en" | "pl") => {
	try {
		const docRef = await addDoc(collection(db, "Expenses"), newExpense).then((docRef) => {
			successMessage(t(lang, "addSuccess"));
			if (file != undefined) {
				uploadFile(file, docRef.id, lang);
			}
		}).catch((error) => {
			console.error(error);
			errorMessage(t(lang, "addFail"));
		})
	} catch (error) {
		console.error(error);
		errorMessage(t(lang, "addFail"));
	}
}

export const uploadFile = (file: File, id: string, lang: "en" | "pl") => {
	const storage = getStorage();
	const storageRef = ref(storage, 'Attachments/'+id+'.'+file.name.split('.').pop());
	const uploadTask = uploadBytesResumable(storageRef, file);
	uploadTask.on('state_changed',
		(snapshot) => {
		}, 
		(error) => {
			// A full list of error codes is available at
			// https://firebase.google.com/docs/storage/web/handle-errors
			switch (error.code) {
			case 'storage/unauthorized':
				errorMessage(t(lang, "uploadFailSize"));
				break;
			case 'storage/canceled':
				errorMessage(t(lang, "uploadFailCancel"));
				break;
			case 'storage/unknown':
				errorMessage(t(lang, "uploadFail"));
				break;
			}
		}, 
		async () => {
			// success
			const billRef = doc(db, "Expenses", id);
			const docSnap = await getDoc(billRef);
			if (docSnap.exists()) {
				await updateDoc(billRef, {
					attachment: id+'.'+file.name.split('.').pop()
					});
				successMessage(t(lang, "uploadSuccess"));
			} else {
				await setDoc(billRef, {
					attachment: id+'.'+file.name.split('.').pop()
					});
				successMessage(t(lang, "uploadSuccess"));
			}
			}
	);
}

export const updateExpense = async (newExpense: any, lang: "en" | "pl") => {
	try {
		if (newExpense.id) {
			delete newExpense.editMode;	//client side only property
			const docRef = doc(db, "Expenses", newExpense.id);
			await updateDoc(docRef, newExpense).then(() => {
				successMessage(t(lang, "updateSuccess"));
			}).catch((error) => {
				console.error(error);
				errorMessage(t(lang, "updateFail"));
			})
		}
	} catch (error) {
		console.error(error);
		errorMessage(t(lang, "updateFail"));
	}
}

export const deleteExpense = async (id: string, lang: "en" | "pl") => {
	try {
		const docRef = doc(db, "Expenses", id);
		await deleteDoc(docRef).then(() => {
			successMessage(t(lang, "deleteSuccess"));
		}).catch((error) => {
			console.error(error);
			errorMessage(t(lang, "deleteFail"));
		})
	} catch (error) {
		console.error(error);
		errorMessage(t(lang, "deleteFail"));
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