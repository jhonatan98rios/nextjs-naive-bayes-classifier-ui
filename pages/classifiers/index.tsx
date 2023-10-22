import { ClassifierDTO, STATUS } from '@/domain/entities/Classifier'
import useDidMount from '@/hooks/hooks'
import { GetServerSideProps } from 'next'
import Link from 'next/link'
import { useState } from 'react'

interface ClassifiersProps {
  _classifiers: ClassifierDTO[]
}

export default function Classifiers({ _classifiers }: ClassifiersProps) {

  const [ classifiers, setClassifiers ] = useState<ClassifierDTO[]>(_classifiers)

  async function fetchClassifierStatus(id: string): Promise<ClassifierDTO> {
    const response = await fetch(`http://localhost:3002/read-classifier/${id}`);
    const data: ClassifierDTO = await response.json()
    return data
  }

  async function updateInProgressClassifiers() {
    let areThereInProgressClassifiers = false
    let areThereChanges = false

    const updatedClassifiers = await Promise.all(
      classifiers.map(async classifier => {
        if (classifier.status !== STATUS.INPROGRESS) return classifier
  
        areThereInProgressClassifiers = true
        const updatedClassifier = await fetchClassifierStatus(classifier.id)
  
        if (classifier.status !== updatedClassifier.status) {
          areThereChanges = true
          classifier = updatedClassifier
        }

        return classifier
      })
    ) 

    if (areThereInProgressClassifiers) {

      if (areThereChanges) {
        setClassifiers(updatedClassifiers)

      } else {
        setTimeout(updateInProgressClassifiers, 1000)
      }
    } 
  }

  useDidMount(() => {
    setTimeout(updateInProgressClassifiers, 1000)
  })

  return (
    <main className="flex min-h-screen flex-col p-4">
      <div>
        <h1 className='text-2xl mb-4 font-semibold text-blue-700'> Classifiers </h1>

        {
          !classifiers &&
          <p className='text-base mb-4'>
            Actually, there is no classifiers. Click on button bellow to create a new classifier.
          </p>
        }

        <Link 
          href="/publish"
          className="flex hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-2 border border-blue-500 rounded w-56 justify-center"
        > Create a new model </Link>

        {
          classifiers && classifiers.map((classifier, index) => (
            <div key={index} className='rounded border border-blue-500 p-4 my-4'>
              <p> ID: { classifier.id } </p>
              <p> Name: { classifier.name } </p>
              <p> File: { classifier.path } </p>
              <p> Status: { classifier.status } </p>

              {
                classifier.status == "ready" && (
                  <>
                    <p> Accuracy: { classifier.accuracy }% </p>
                  
                    <Link 
                      href={`/classify/${classifier.id}`}
                      className="flex hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-2 border border-blue-500 rounded w-56 justify-center mt-4"
                    > Executar </Link>
                  </>
                )
              }
            </div>
          ))
        }
      </div>
    </main>
  )
}


export const getServerSideProps: GetServerSideProps<{_classifiers: ClassifierDTO[]}> = (async (context) => {
  try {
    const response = await fetch("http://localhost:3002/list-classifiers");
    const _classifiers: ClassifierDTO[] = await response.json()
    return { props: { _classifiers } }
  } catch (err) {
    console.log(err)
    return { props: { _classifiers: [] } }
  }
})