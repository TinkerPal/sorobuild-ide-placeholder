import React, { useState } from "react";
import { List, LayoutGrid } from "lucide-react"; // Optional: Install lucide-react for icons

const integrations = [
  {
    name: "Gmail",
    description: "Direct Integration",
    details:
      "Lorem ipsum dolor sit amet, consectetur adipis cing elit, sed do eiusmod tempor incididunt ut labore et dolore.",
    logo: "https://cdn.rareblocks.xyz/collection/celebration/images/integration/3/gmail-logo.png",
  },
  {
    name: "Slack",
    description: "Direct Integration",
    details:
      "Lorem ipsum dolor sit amet, consectetur adipis cing elit, sed do eiusmod tempor incididunt ut labore et dolore.",
    logo: "https://cdn.rareblocks.xyz/collection/celebration/images/integration/3/slack-logo.png",
  },
  {
    name: "Shopify",
    description: "Direct Integration",
    details:
      "Lorem ipsum dolor sit amet, consectetur adipis cing elit, sed do eiusmod tempor incididunt ut labore et dolore.",
    logo: "https://cdn.rareblocks.xyz/collection/celebration/images/integration/3/shopify-logo.png",
  },
  {
    name: "Intercom",
    description: "Direct Integration",
    details:
      "Lorem ipsum dolor sit amet, consectetur adipis cing elit, sed do eiusmod tempor incididunt ut labore et dolore.",
    logo: "https://cdn.rareblocks.xyz/collection/celebration/images/integration/3/intercom-logo.png",
  },
  {
    name: "Twitter",
    description: "Direct Integration",
    details:
      "Lorem ipsum dolor sit amet, consectetur adipis cing elit, sed do eiusmod tempor incididunt ut labore et dolore.",
    logo: "https://cdn.rareblocks.xyz/collection/celebration/images/integration/3/twitter-logo.png",
  },
  {
    name: "Sketch",
    description: "Direct Integration",
    details:
      "Lorem ipsum dolor sit amet, consectetur adipis cing elit, sed do eiusmod tempor incididunt ut labore et dolore.",
    logo: "https://cdn.rareblocks.xyz/collection/celebration/images/integration/3/sketch-logo.png",
  },
];

export default function Campaign() {
  const [viewMode, setViewMode] = useState("grid");

  return (
    <section className="py-10 bg-gray-50 sm:py-16 lg:py-24">
      <div className="px-4 mx-auto sm:px-6 lg:px-8 max-w-7xl">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold leading-tight text-black sm:text-4xl lg:text-5xl">
            Integrate with apps
          </h2>
          <p className="max-w-xl mx-auto mt-4 text-base leading-relaxed text-gray-600">
            Amet minim mollit non deserunt ullamco est sit aliqua dolor do amet
            sint. Velit officia consequat duis.
          </p>
        </div>

        {/* Toggle Buttons */}
        <div className="flex justify-end mt-8 space-x-2 sm:mt-10">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded-md border ${
              viewMode === "grid" ? "bg-blue-600 text-white" : "text-gray-600"
            } hover:bg-blue-50 transition`}
          >
            <LayoutGrid className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-md border ${
              viewMode === "list" ? "bg-blue-600 text-white" : "text-gray-600"
            } hover:bg-blue-50 transition`}
          >
            <List className="w-5 h-5" />
          </button>
        </div>

        {/* Cards */}
        <div
          className={`mt-8 grid ${
            viewMode === "grid"
              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 xl:gap-10"
              : "grid-cols-1 gap-6"
          }`}
        >
          {integrations.map((item, idx) => (
            <div
              key={idx}
              className={`overflow-hidden bg-white rounded shadow ${
                viewMode === "list"
                  ? "flex flex-col sm:flex-row items-start p-6"
                  : "p-8"
              }`}
            >
              <div className="flex items-center">
                <img
                  className="w-12 h-auto flex-shrink-0"
                  src={item.logo}
                  alt={item.name}
                />
                <div className="ml-5 mr-auto">
                  <p className="text-xl font-semibold text-black">
                    {item.name}
                  </p>
                  <p className="mt-px text-sm text-gray-600">
                    {item.description}
                  </p>
                </div>
              </div>
              <p
                className={`text-base leading-relaxed text-gray-600 ${
                  viewMode === "grid" ? "mt-7" : "sm:ml-5 sm:mt-0 mt-4"
                }`}
              >
                {item.details}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <a
            href="#"
            title="Check all apps"
            className="inline-flex p-3 font-medium text-blue-600 transition-all duration-200 hover:text-blue-700 focus:text-blue-700 hover:underline"
          >
            Check all 1,593 applications
          </a>
        </div>
      </div>
    </section>
  );
}
