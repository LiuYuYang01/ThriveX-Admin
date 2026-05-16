export default () => {
  return (
    <div className="space-y-2">
      <div className="bg-primary rounded-xl p-6 sm:p-10 flex flex-col justify-center h-[170px] relative overflow-hidden mb-3">
        <div className="relative z-10 w-full flex flex-col gap-2.5">
          <div className="skeleton h-7 rounded-sm" style={{ width: 400, maxWidth: '100%', opacity: 0.8 }} />
          <div className="skeleton h-5 rounded-sm" style={{ width: 300, maxWidth: '80%', opacity: 0.75 }} />
          <div className="skeleton h-8 rounded-sm" style={{ width: 120, maxWidth: '40%', opacity: 0.7 }} />
        </div>
      </div>

      <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="rounded-xl border border-stroke py-6 px-7 shadow-default dark:border-transparent bg-light-gradient dark:bg-dark-gradient"
          >
            <div className="space-y-2">
              <div className="skeleton h-4 rounded-sm" style={{ width: 80 }} />
              <div className="skeleton h-8 rounded-sm" style={{ width: 100 }} />
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl mt-2 grid grid-cols-12 gap-2">
        <div className="col-span-12 xl:col-span-8 rounded-xl border border-stroke px-5 pt-7 pb-5 shadow-default dark:border-transparent bg-light-gradient dark:bg-dark-gradient">
          <div className="skeleton h-6 rounded-sm mb-4" style={{ width: 120 }} />
          <div className="skeleton h-[400px] rounded-sm w-full" />
        </div>

        <div className="col-span-12 xl:col-span-4 rounded-xl border border-stroke px-5 pt-7 pb-5 shadow-default dark:border-transparent bg-light-gradient dark:bg-dark-gradient">
          <div className="skeleton h-6 rounded-sm mb-4" style={{ width: 100 }} />
          <div className="skeleton h-[300px] rounded-sm w-full" />
        </div>
      </div>
    </div>
  );
};
