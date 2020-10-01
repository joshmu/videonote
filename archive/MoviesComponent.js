import { useEffect, useState } from 'react'

export default function Movies() {
  const [movies, setMovies] = useState([])

  useEffect(() => {
    fetch('/api/movies')
      .then(res => res.json())
      .then(data => setMovies(data))
  }, [])

  return (
    <div>
      <h1>Top 20 Movies of All Time</h1>
      <p>
        <small>(According to Metacritic)</small>
      </p>
      {movies.length && (
        <ul className='text-black'>
          {movies.map((movie, idx) => (
            <li key={idx}>
              <h2>{movie.title}</h2>
              <h3>{movie.metacritic}</h3>
              <p>{movie.plot}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
