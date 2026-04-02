import {
  collection,
  getDocs,
  updateDoc,
  doc,
  addDoc,
  serverTimestamp,
  deleteDoc,
} from 'firebase/firestore'
import { db } from './firebase'

const HERBS = 'herbs'
const LOGS = 'stock_logs'

// 获取全部药材
export async function getHerbs() {
  const snap = await getDocs(collection(db, HERBS))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

// 更新库存
export async function updateHerbStock(id, newStock, herbName) {
  await updateDoc(doc(db, HERBS, id), {
    stock: newStock,
  })

  // 🔥 写日志
  await addDoc(collection(db, LOGS), {
    herbName,
    change: newStock,
    type: 'update',
    timestamp: serverTimestamp(),
  })
}

// 删除药材
export async function deleteHerb(id) {
  await deleteDoc(doc(db, HERBS, id))
}
