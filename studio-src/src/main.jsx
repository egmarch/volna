import { createRoot } from 'react-dom/client'
import css from './index.css?inline'
import App from './App'

// CSS вшит в скрипт, чтобы страница работала при открытии по file://
const style = document.createElement('style')
style.textContent = css
document.head.appendChild(style)

createRoot(document.getElementById('root')).render(<App />)
