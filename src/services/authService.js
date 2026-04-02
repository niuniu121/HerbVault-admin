import { signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { doc, getDocFromServer, setDoc } from 'firebase/firestore'
import { auth, db } from './firebase'

export async function loginWithEmail(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const firebaseUser = userCredential.user

    console.log('Login success:', firebaseUser.uid)

    const userRef = doc(db, 'users', firebaseUser.uid)
    let userSnap = await getDocFromServer(userRef)

    // 🧠 自动创建用户
    if (!userSnap.exists()) {
      console.log('User not found → creating...')

      const newUser = {
        email: firebaseUser.email,
        displayName: firebaseUser.email?.split('@')[0] || 'User',
        role: 'admin', // ⚠️ 你现在是 admin 项目
        createdAt: new Date(),
      }

      await setDoc(userRef, newUser)

      userSnap = await getDocFromServer(userRef)
    }

    const userData = userSnap.data()

    // 权限控制
    if (userData.role !== 'admin') {
      throw new Error('Access denied. Admin only.')
    }

    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      ...userData,
    }
  } catch (error) {
    console.error('Login error:', error)

    if (error.code === 'auth/invalid-credential') {
      throw new Error('Incorrect email or password.')
    }

    throw new Error(error.message || 'Login failed.')
  }
}

export async function logoutUser() {
  await signOut(auth)
}
