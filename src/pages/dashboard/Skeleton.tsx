export default () => {
  return (
    <div className="space-y-2">
      <div className="relative mb-3 flex h-[170px] flex-col justify-center overflow-hidden rounded-xl bg-primary p-6 sm:p-10">
        <div className="relative z-10 flex w-full flex-col gap-2.5">
          <div className="skeleton h-7 rounded-sm" style={{ width: 400, maxWidth: '100%', opacity: 0.8 }} />
          <div className="skeleton h-5 rounded-sm" style={{ width: 300, maxWidth: '80%', opacity: 0.75 }} />
          <div className="skeleton h-8 rounded-sm" style={{ width: 120, maxWidth: '40%', opacity: 0.7 }} />
        </div>
      </div>

      <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="rounded-xl border border-stroke bg-light-gradient px-7 py-6 shadow-default dark:border-transparent dark:bg-dark-gradient"
          >
            <div className="space-y-2">
              <div className="skeleton h-4 rounded-sm" style={{ width: 80 }} />
              <div className="skeleton h-8 rounded-sm" style={{ width: 100 }} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-2 mb-[15px] grid grid-cols-12 gap-2">
        <div className="col-span-12 rounded-xl border border-stroke bg-light-gradient px-5 pb-5 pt-7 shadow-default dark:border-transparent dark:bg-dark-gradient sm:px-7 xl:col-span-8">
          <div className="skeleton mb-4 h-6 rounded-sm" style={{ width: 120 }} />
          <div className="skeleton h-[400px] w-full rounded-sm" />
        </div>

        <div className="col-span-12 rounded-xl border border-stroke bg-light-gradient px-5 pb-4 pt-7 shadow-default dark:border-transparent dark:bg-dark-gradient sm:px-7 xl:col-span-4">
          <div className="skeleton mb-4 h-6 rounded-sm" style={{ width: 100 }} />
          <div className="skeleton h-[300px] w-full rounded-sm" />
        </div>
      </div>
    </div>
  );
};
