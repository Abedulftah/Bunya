Role: Expert Frontend Developer, React/TypeScript Specialist, and Computer Science Educator.

Goal: Build a modern, highly interactive React component (written in TypeScript `.tsx`) called "Arabic VisuAlgo". This application is heavily inspired by https://visualgo.net and is designed to help Arab high school students visualize data structures and algorithms for their matriculation exam (Bagrut).

Reference Material (VisuAlgo Inspiration):
Model the UX/UI after https://visualgo.net:
- Use clear color coding for different states (e.g., unvisited nodes, currently active/compared elements, sorted elements, pointers like Head/Tail or Top).
- Implement a step-by-step execution flow where pseudo-code/code lines are highlighted concurrently with the visual changes on the canvas.
- Provide interactive controls: Play, Pause, Step Forward, Step Backward, Speed Slider, and Reset.

Tech Stack:
- React (Functional components, hooks like useState, useEffect, useRef)
- TypeScript (Strict types for data structure nodes and animation states)
- Tailwind CSS (For styling and smooth transitions)
- Lucide React (Optional, for clean control icons)

UI/UX Requirements:
1. Direction & Language: The entire application wrapper must support RTL (Right-to-Left) with grammatically correct Arabic text, titles, and explanations. 
2. Split-Screen Layout: 
   - Right Side: The VisuAlgo-inspired Visualization Canvas.
   - Left Side: The Interactive Code Panel (Mini-IDE) and step-by-step code execution tracker.

Core Feature 1: Data Structure Visualizations (VisuAlgo Style)
Create switchable tabs for 4 essential data structures, mimicking the visual logical flows of visualgo.net:
1. Stack (المكدس): Vertical container. Visualized operations: Push (element slides from the top into the stack) and Pop (top element flashes and exits).
2. Queue (الطابور): Horizontal sequence flowing from Left-to-Right (matching Arabic layout, where Rear is on the left and Front/Exit is on the right). Visualized operations: Enqueue and Dequeue.
3. Sorting (الفرز - Bubble Sort): An array of vertical bars. Use React state to animate bar comparisons (turn red) and swaps (smooth CSS transitions), pausing execution using an async delay utility.
4. Linked List (القائمة الموصولة): Render nodes as blocks containing a Value and a Next pointer. Draw SVG arrows dynamically connecting the nodes. Animate inserting/deleting at Head, Tail, or a specific index.

Core Feature 2: "Code-to-Animation" Live Execution Engine
Create a custom interactive code panel where students can write code snippets and see them compile into visual movements on the canvas:
- Provide a responsive code editor area initialized with basic Java/C# style syntax templates.
- Implement a lightweight line-by-line interpreter using Regex in TypeScript. It should detect operations like:
    mystack.push(15);
    mystack.pop();
    myqueue.enqueue(8);
- When clicking "Run Code", step through the written code line-by-line. Highlight the active line of code in the UI, trigger the corresponding React state animation, wait for it to finish based on the speed slider, and then move to the next line.

Implementation Guidelines:
- Provide the complete solution as clean, production-ready, modular React TypeScript (`.tsx`) code. 
- Use standard Tailwind utility classes for animations (e.g., `transition-all duration-500`).
- Ensure all states (such as arrays, linked list object trees, and simulation playback states) are properly typed using TypeScript interfaces.