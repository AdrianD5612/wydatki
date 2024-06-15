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
	balance?: number; // used only on client side to handle balance calculating
}

/**
 * Function to retrieve permissions based on ID and set modify permission.
 *
 * @param {string} id - The ID for which permissions are being retrieved.
 * @param {any} setModifyPermission - The function to set modify permission.
 * @return {void} No return value.
 */
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

/**
 * Retrieves expenses from the Firestore collection "Expenses" and updates the state with the retrieved data.
 *
 * @param {Function} setExpenses - The state setter function for the expenses.
 * @param {Function} setFinished - The state setter function for indicating if the expenses have been fully loaded.
 * @return {void}
 */
export const getExpenses = (setExpenses: any, setFinished: any) => {
	try {
		const unsub = onSnapshot(collection(db, "Expenses"), doc => {
			const docs: Expense[] = []
            doc.forEach((d: any) => {
				docs.push( { ...d.data(), id: d.id });	
			});
			docs.sort((a:Expense, b:Expense) => a.date.toMillis() - b.date.toMillis());
			//calculating client side property: balance
			let balance = 0;
			docs.forEach((expense, index) => {
				balance += expense.amount;
				docs[index].balance = Math.round((balance + Number.EPSILON) * 100) / 100;	//rounding to 2 decimal places
			});
			docs.reverse();	//showing most recent expenses first
			setExpenses(docs);
			setFinished(true);
        });
	} catch (error) {
		console.error(error);
		setExpenses([]);
	}
}

/**
 * Uploads a new expense to the Firestore database and displays a success message if successful.
 *
 * @param {Expense} newExpense - The new expense object to be uploaded.
 * @param {File | undefined} file - The file to be uploaded as an attachment to the expense.
 * @param {"en" | "pl"} lang - The language of the success message to be displayed.
 * @return {Promise<void>} A Promise that resolves when the expense is successfully uploaded, or rejects with an error.
 */
export const uploadNewExpense = async (newExpense: Expense, file: File | undefined, lang: "en" | "pl") => {
	try {
		delete newExpense.id; //id should not be in doc data
		const docRef = await addDoc(collection(db, "Expenses"), newExpense).then((docRef) => {
			successMessage(newExpense.name+t(lang, "addSuccess"));
			if (file != undefined) {
				uploadFile(file, docRef.id, lang);
			}
		}).catch((error) => {
			console.error(error);
			errorMessage(newExpense.name+t(lang, "addFail"));
		})
	} catch (error) {
		console.error(error);
		errorMessage(newExpense.name+t(lang,"addFail"));
	}
}

/**
 * Uploads a file to the storage with error handling and success messages.
 *
 * @param {File} file - The file to be uploaded.
 * @param {string} id - The ID related to the file.
 * @param {"en" | "pl"} lang - The language for messages.
 */
export const uploadFile = (file: File, id: string, lang: "en" | "pl") => {
	const storage = getStorage();
	const storageRef = ref(storage, 'Attachments/'+id+'.'+file.name.split('.').pop());
	let toastId : any = null;
	const uploadTask = uploadBytesResumable(storageRef, file);
	uploadTask.on('state_changed',
		(snapshot) => {
			const progress = Math.round( (snapshot.bytesTransferred / snapshot.totalBytes) * 100 ) / 100;
			if (toastId === null) {
				toastId = toast(t(lang, "uploading"), { progress, theme: "dark" });
			  } else {
				toast.update(toastId, { progress });
			  } 
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
			toast.done(toastId);
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

/**
 * Updates an expense in the Firestore database based on the provided newExpense object.
 *
 * @param {any} newExpense - The new expense object to be updated.
 * @param {"en" | "pl"} lang - The language for messages.
 * @return {Promise<void>} A Promise that resolves when the expense is successfully updated, or rejects with an error.
 */
export const updateExpense = async (newExpense: any, lang: "en" | "pl") => {
	try {
		if (newExpense.id) {
			delete newExpense.editMode;	//client side only property
			delete newExpense.balance;	//client side only property
			const docRef = doc(db, "Expenses", newExpense.id);
			delete newExpense.id; //id should not be in doc data
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

/**
 * Deletes an expense from the Firestore database based on the provided ID.
 *
 * @param {string} id - The ID of the expense to be deleted.
 * @param {"en" | "pl"} lang - The language for messages.
 * @return {Promise<void>} A Promise that resolves when the expense is successfully deleted, or rejects with an error.
 */
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
 * Retrieves the URL of an attachment from Firebase Storage and sets it in the view URL state.
 *
 * @param {string} id - The ID of the attachment.
 * @param {React.Dispatch<React.SetStateAction<string>>} setViewUrl - The state setter for the view URL.
 * @param {"en" | "pl"} lang - The language for error messages.
 * @return {Promise<void>} A Promise that resolves when the URL is successfully set, or rejects with an error.
 */
export const generateUrlFromStorage = async (id: string, setViewUrl: any, lang: "en" | "pl") => {
	try {
		const storage = getStorage();
		const storageRef = ref(storage, 'Attachments/'+id);
		const url = await getDownloadURL(storageRef).then((url) => {
			setViewUrl(url);
		}).catch((error) => {
			console.error(error);
			errorMessage(t(lang, "downloadFail"));
		})
	} catch (error) {
		console.error(error);
		errorMessage(t(lang, "downloadFail"));
	}
}

/**
 * Deletes an attachment from Firebase Storage and updates the corresponding expense document in Firestore.
 *
 * @param {string} id - The ID of the expense document.
 * @param {string} attachmentFileName - The name of the attachment file.
 * @param {"en" | "pl"} lang - The language for success and error messages.
 * @return {Promise<void>} A Promise that resolves when the attachment is successfully deleted, or rejects with an error.
 */
export const deleteAttachment = async (id: string, attachmentFileName: string, lang: "en" | "pl") => {
	try {
		const storage = getStorage();
		const storageRef = ref(storage, 'Attachments/'+attachmentFileName);
		await deleteObject(storageRef).then(async () => {
			await updateDoc(doc(db, "Expenses", id), {
				attachment: ''
				});
			successMessage(t(lang, "deleteFileSuccess"));
		}).catch((error) => {
			console.error(error);
			errorMessage(t(lang, "deleteFileFail"));
		})
	} catch (error) {
		console.error(error);
		errorMessage(t(lang, "deleteFileFail"));
	}
}

/**
 * Handles importing data from a file, parsing it, and updating Firestore documents based on the imported data.
 *
 * @param {File | undefined} file - The file to import.
 * @param {any} setImportMode - The function to set the import mode.
 * @param {"en" | "pl"} lang - The language setting for the import.
 */
export const importFromFile = (file: File | undefined, setImportMode: any, lang: "en" | "pl") => {
    if (file) {
      const reader = new FileReader();

      reader.onload = async (event) => {
        const content = event.target?.result as string;
        try {
          const parsedObjects = JSON.parse(content) as Expense[];
          for (const obj of parsedObjects) {
			if (!(obj.date instanceof Timestamp)) {  //avoid converting already converted date
				obj.date = Timestamp.fromDate(new Date(Date.parse(obj.date.toString())));	//converting string date to firebase timestamp
			}
			if (typeof obj.amount !== 'number' || Number.isNaN(obj.amount)) {
				try {
					obj.amount = parseFloat(obj.amount.toString().replace(/,/g, '.'));	//handle comma as decimal separator
				} catch (error) {
					console.error(error);
					errorMessage(t(lang, "importFail"));
					return;
				}
			}
			//check if doc with that id already exists
			const docRef = doc(db, "Expenses", obj.id===undefined? "error" : obj.id);
			const docSnap = await getDoc(docRef);
			if (docSnap.exists()) {
				await updateExpense(obj, lang); //exists so update it
			} else {
				await uploadNewExpense(obj, undefined, lang); //don't exist so create it
			}
          }
        } catch (error) {
          console.error(error);
          errorMessage(t(lang, "importFail"));
        }
      };
      reader.readAsText(file);
      setImportMode(false);
    }
	else {
		errorMessage(t(lang, "importFail"));
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
		theme: "dark",
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
		theme: "dark",
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
		})
		.catch((error) => {
			errorMessage(t(lang, "logoutFail"));
		});
};