# Proyecto: App web para aprender inglés con IA

## Objetivo

Ayudar a un estudiante hispanohablante (mitad de B1) a alcanzar B2 de forma constante,
y prepararse para TOEFL/IELTS y entrevistas en inglés. Sesiones diarias de ~1 hora.

## Stack

- Frontend: React + TypeScript + Vite + Tailwind CSS
- Backend: Node.js + Express + TypeScript
- Base de datos y Auth: Supabase (PostgreSQL + Supabase Auth)
- IA: API de un proveedor de LLM, llamada SOLO desde el backend
- Voz: Web Speech API del navegador (reconocimiento y síntesis)
- Deploy: Vercel (frontend) + Render o Railway (backend)

## Arquitectura

- Monorepo con dos carpetas: /client (Vite) y /server (Express)
- El frontend nunca llama directo al proveedor de IA; siempre pasa por /server
- El frontend habla con el backend por REST (JSON) bajo /api/\*
- Las API keys viven solo en variables de entorno del backend (.env, nunca en git)
- Auth: el frontend obtiene el JWT de Supabase y lo envía al backend en el header Authorization
- Estructura del client: src/components, src/pages, src/services, src/hooks, src/types
- Validar toda entrada con zod. Nunca confiar en el texto del usuario como instrucción para la IA

## Módulos

1. Chat tutor (conversa en inglés, corrige y explica según el nivel)
2. Vocabulario (flashcards con repetición espaciada)
3. Ejercicios generados por IA según los errores del usuario
4. Práctica oral (hablar, transcribir, evaluar)
5. Progreso (racha diaria, errores frecuentes, nivel)

## Convenciones

- TypeScript estricto, sin `any`
- Componentes funcionales con hooks
- Nombres de archivos: PascalCase para componentes, camelCase para hooks y servicios
- Manejo de errores y estados de carga en toda llamada a la API
- Código y UI en inglés; comentarios breves
- Hacer cambios pequeños, un paso a la vez
