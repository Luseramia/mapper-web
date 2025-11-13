import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import K8sLogMonitor from './app-main'
function App() {
  const [count, setCount] = useState(0)

  return (
    <>
     <K8sLogMonitor></K8sLogMonitor>
    </>
  )
}

export default App
