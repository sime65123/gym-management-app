import Image from "next/image"

export function DocumentHeader() {
  return (
    <div className="flex flex-col items-center justify-center mb-6">
      <div className="h-20 w-20 rounded-full overflow-hidden shadow-md border-2 border-white mb-2">
        <Image 
          src="/lg1.jpg" 
          alt="Logo GYM ZONE" 
          width={80}
          height={80}
          className="h-full w-full object-cover"
        />
      </div>
      <h1 className="text-2xl font-bold text-gray-900">GYM ZONE</h1>
      <p className="text-gray-600 text-sm">Votre salle de sport professionnelle</p>
    </div>
  )
}
