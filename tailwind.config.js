/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ["./src/**/*.{js,jsx,ts,tsx}"],
	presets: [require("nativewind/preset")],
	theme: {
		extend: {
			colors: {
				cream: "#fffbeb",
				clear: {
					DEFAULT: "#1e3a5f",
					star: "#fbbf24",
				},
			},
			fontFamily: {
				sans: ["ZenMaruGothic_500Medium"],
				heading: ["ZenMaruGothic_700Bold"],
			},
		},
	},
	plugins: [],
};
