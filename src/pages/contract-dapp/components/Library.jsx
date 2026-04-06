import React from "react";

export default function Library() {
  return (
    <section className="py-6 bg-gray-50 sm:py-8 lg:py-10 rounded-xl">
      <div className="px-2 mx-auto max-w-7xl sm:px-2 lg:px-2">
        <div className="text-center">
          <h2 className="text-2xl  text-gray-900 sm:text-4xl xl:text-3xl font-pj">
            Select from library
          </h2>
          <p className="max-w-lg mx-auto mt-6 text-lg font-normal text-gray-600 font-pj">
            Select common contract from our library of soroban contracts.
          </p>
        </div>

        <div className="max-w-xl mx-auto mt-6 sm:px-6 flex flex-col gap-4">
          <div className="relative ">
            <span
              className="absolute w-px h-full -ml-px bg-gray-200 top-8 left-12"
              aria-hidden="true"
            ></span>

            <div className="relative p-5 overflow-hidden bg-white border border-gray-200 rounded-2xl">
              <div className="flex items-start sm:items-center">
                <div className="inline-flex items-center justify-center flex-shrink-0 text-xl font-bold text-white bg-gray-900 w-14 h-14 rounded-xl font-pj">
                  1
                </div>
                <p className="ml-6 text-xl font-medium text-gray-900 font-pj">
                  Sign up for creating your first online store with ease.
                </p>
              </div>
            </div>
          </div>

          <div className="relative">
            <span
              className="absolute w-px h-full -ml-px bg-gray-200 top-8 left-12"
              aria-hidden="true"
            ></span>

            <div className="absolute -mt-10 inset-y-8 -inset-x-1">
              <div
                className="w-full h-full mx-auto opacity-30 blur-lg filter"
                style={{
                  background:
                    "linear-gradient(90deg, #44ff9a -0.55%, #44b0ff 22.86%, #8b44ff 48.36%, #ff6644 73.33%, #ebff70 99.34%)",
                }}
              ></div>
            </div>

            <div className="relative p-5 overflow-hidden bg-white border border-gray-200 rounded-2xl">
              <div className="flex items-start sm:items-center">
                <div className="inline-flex items-center justify-center flex-shrink-0 text-xl font-bold text-white bg-gray-900 w-14 h-14 rounded-xl font-pj">
                  2
                </div>
                <p className="ml-6 text-xl font-medium text-gray-900 font-pj">
                  Add your products to your store and customize.
                </p>
              </div>
            </div>
          </div>

          <div className="relative ">
            <span
              className="absolute w-px h-full -ml-px bg-gray-200 top-8 left-12"
              aria-hidden="true"
            ></span>

            <div className="relative p-5 overflow-hidden bg-white border border-gray-200 rounded-2xl">
              <div className="flex items-start sm:items-center">
                <div className="inline-flex items-center justify-center flex-shrink-0 text-xl font-bold text-white bg-gray-900 w-14 h-14 rounded-xl font-pj">
                  3
                </div>
                <p className="ml-6 text-xl font-medium text-gray-900 font-pj">
                  Get realtime analytics and report of your shop easily.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
