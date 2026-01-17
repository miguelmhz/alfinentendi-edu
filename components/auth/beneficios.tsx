import { CheckCircle } from 'lucide-react'
import React from 'react'


const beneficios = ( {activeTab}: {activeTab: "individual" | "escuela"} ) => {
    const beneficios = {
        individual: [
            "Libros digitales",
            "Recursos educativos",
            "Acceso a la biblioteca",
            "Foro estudiantil",
        ],
        escuela: [
            "Libros digitales",
            "Licencias para estudiantes",
            "Guias docentes",
            "Foro interactivo",
        ]
    }
  
    return (
    <div className='absolute top-0 left-0 right-0 bottom-0 flex flex-col gap-4 items-start justify-end z-10 p-4 lg:p-8 items-center'>
        {/*beneficios, cuadircula de 2x2*/}
        <h2 className="text-4xl font-bold w-full text-white">{activeTab === "individual" ? "Acceso Individual" : "Acceso Escuela"}</h2>
        <div className="grid grid-cols-2 grid-rows-2 gap-4 w-full">
            {beneficios[activeTab].map((beneficio, index) => (
                <div key={index} className="flex items-center">
                    <CheckCircle className="w-6 h-6 text-blue-500" />
                    <p className="ml-2 text-white text-lg">{beneficio}</p>
                </div>
            ))}
        </div>
    </div>
  )
}

export default beneficios