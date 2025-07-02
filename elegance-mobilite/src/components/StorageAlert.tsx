import { AlertTriangle, ExternalLink } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

interface StorageAlertProps {
  instructions: string[]
  missingBuckets?: string[]
}

export function StorageAlert({ instructions, missingBuckets }: StorageAlertProps) {
  return (
    <Alert className="border-orange-500 bg-orange-50/10 border-2">
      <AlertTriangle className="w-5 h-5 text-orange-500" />
      <AlertTitle className="text-orange-300">Configuration Storage requise</AlertTitle>
      <AlertDescription className="text-orange-200 space-y-3 mt-2">
        <p>
          Les buckets Supabase Storage doivent être créés manuellement pour que l'upload de fichiers fonctionne.
        </p>
        
        {missingBuckets && (
          <div className="bg-orange-900/20 p-3 rounded-lg">
            <p className="font-medium text-orange-300 mb-1">Buckets manquants :</p>
            <ul className="list-disc list-inside text-sm space-y-1">
              {missingBuckets.map(bucket => (
                <li key={bucket} className="text-orange-200">{bucket}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-2">
          <p className="font-medium text-orange-300">Instructions :</p>
          <ol className="list-decimal list-inside text-sm space-y-1">
            {instructions.map((instruction, index) => (
              <li key={index} className="text-orange-200">{instruction}</li>
            ))}
          </ol>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <Button
            onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
            className="bg-orange-600 hover:bg-orange-700 text-white"
            size="sm"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Ouvrir Supabase Dashboard
          </Button>
          
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="border-orange-500 text-orange-300 hover:bg-orange-900/20"
            size="sm"
          >
            Recharger la page
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}
