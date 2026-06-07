import { ReactNode } from 'react'

interface Props {
    value: string,
    children?: ReactNode,
    className?: string
}

export default ({ value, children, className = '' }: Props) => {
    return (
        <div className={`mb-2 rounded-2xl border border-slate-200/80 bg-white px-5 py-3.5 dark:border-strokedark dark:bg-boxdark ${className}`}>
            <div className="flex items-center justify-between gap-4 overflow-auto">
                <h2 className="min-w-24 text-xl font-bold text-slate-900 dark:text-white">{value}</h2>

                {children}
            </div>
        </div>
    )
}