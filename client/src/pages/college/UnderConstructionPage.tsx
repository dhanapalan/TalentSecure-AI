export default function UnderConstructionPage({ title }: { title: string }) {
    return (
        <div className="flex min-h-screen items-center justify-center p-8 bg-slate-50">
            <div className="text-center max-w-md">
                <h1 className="text-3xl font-black text-slate-900 mb-2">{title}</h1>
                <p className="text-sm font-semibold text-slate-500">
                    This section is currently under development. Please check back later.
                </p>
            </div>
        </div>
    );
}
