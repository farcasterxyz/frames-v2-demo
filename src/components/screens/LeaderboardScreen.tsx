import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ScoreEntry {
  id: string;
  score: number;
  name: string;
  date: string;
}

interface LeaderboardArchive {
  id: string;
  weekNumber: number;
  year: number;
  date: string;
  scores: ScoreEntry[];
}

const LeaderboardScreen = () => {
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [archives, setArchives] = useState<LeaderboardArchive[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isArchiveLoading, setIsArchiveLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const [displayCount, setDisplayCount] = useState<number>(10);
  const [totalAvailable, setTotalAvailable] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<string>("current");

  // Fetch current high scores
  const fetchHighScores = async (limit: number) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`/api/highscores?limit=${limit}`);
      
      if (response.ok) {
        const data = await response.json();
        setScores(data);
        setTotalAvailable(data.length);
      } else {
        throw new Error('Failed to fetch high scores');
      }
    } catch (err) {
      console.error('Failed to fetch high scores:', err);
      setError('Failed to load current ranking data');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch leaderboard archives
  const fetchArchives = async () => {
    try {
      setIsArchiveLoading(true);
      setArchiveError(null);
      const response = await fetch('/api/highscores/archives');
      
      if (response.ok) {
        const data = await response.json();
        setArchives(data);
      } else {
        throw new Error('Failed to fetch leaderboard archives');
      }
    } catch (err) {
      console.error('Failed to fetch leaderboard archives:', err);
      setArchiveError('Failed to load historical leaderboard data');
    } finally {
      setIsArchiveLoading(false);
    }
  };

  // Load more scores
  const handleShowMore = () => {
    const nextDisplayCount = displayCount === 10 ? 100 : 10;
    setDisplayCount(nextDisplayCount);
    fetchHighScores(nextDisplayCount);
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { 
      year: 'numeric',
      month: 'short', 
      day: 'numeric'
    });
  };

  useEffect(() => {
    fetchHighScores(displayCount);
  }, []);

  // Load archives when tab is switched
  useEffect(() => {
    if (activeTab === "archives" && archives.length === 0) {
      fetchArchives();
    }
  }, [activeTab]);

  // Render a single leaderboard table
  const renderLeaderboard = (data: ScoreEntry[], title: string | null = null) => {
    if (data.length === 0) {
      return <div className="text-gray-400 text-center my-10">No scores recorded</div>;
    }

    return (
      <div className="flex flex-col">
        {title && (
          <h3 className="text-lg font-semibold text-white mb-3">{title}</h3>
        )}
        <div className="bg-green-950 rounded-lg shadow-lg overflow-hidden border border-green-800">
          <table className="w-full">
            <thead>
              <tr className="bg-green-900">
                <th className="py-3 text-left text-white pl-4 w-10">#</th>
                <th className="py-3 text-left text-white">Name</th>
                <th className="py-3 text-right text-white pr-4">Score</th>
              </tr>
            </thead>
            <tbody>
              {data.map((entry, index) => (
                <tr 
                  key={index} 
                  className={`
                    border-t border-green-800
                    ${index < 3 ? 'bg-green-800/60' : 'bg-green-900/40'}
                    ${index === 0 ? 'text-yellow-400' : ''}
                    ${index === 1 ? 'text-gray-300' : ''}
                    ${index === 2 ? 'text-amber-700' : ''}
                  `}
                >
                  <td className="py-3 pl-4 font-bold">
                    {index === 0 && '🥇'}
                    {index === 1 && '🥈'}
                    {index === 2 && '🥉'}
                    {index > 2 && index + 1}
                  </td>
                  <td className="py-3">
                    {entry.name || 'Anonymous'}
                  </td>
                  <td className="py-3 pr-4 text-right font-bold">
                    {entry.score.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center justify-start h-full p-6 overflow-auto pb-20">
      <div className="w-full max-w-md">
        <h2 className="text-2xl font-bold text-center text-white mb-2">
          Top Rankings
        </h2>
        
        <div className="bg-yellow-700 bg-opacity-20 rounded-lg p-4 mb-6">
          <p className="text-yellow-400 text-center text-sm">
            <span role="img" aria-label="trophy">🏆</span> Top 10 players will receive special rewards each week! Leaderboard resets every Monday at 00:00 WIB.
          </p>
        </div>
        
        <Tabs 
          defaultValue="current"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full mb-4"
        >
          <TabsList className="grid grid-cols-2 w-full bg-green-900">
            <TabsTrigger value="current" className="text-white">Current Week</TabsTrigger>
            <TabsTrigger value="archives" className="text-white">Past Winners</TabsTrigger>
          </TabsList>
          
          <TabsContent value="current" className="pt-4">
            {isLoading ? (
              <div className="flex justify-center my-10">
                <div className="w-8 h-8 border-4 border-green-500 rounded-full border-t-transparent animate-spin"></div>
              </div>
            ) : error ? (
              <div className="text-red-400 text-center my-10">{error}</div>
            ) : (
              <>
                {renderLeaderboard(scores)}
                
                {/* Toggle button to show more/less scores */}
                <div className="flex justify-center mt-4 mb-8">
                  <Button 
                    variant="outline" 
                    className={`
                      px-6 py-2 
                      ${displayCount === 10 ? 'bg-green-700 hover:bg-green-600' : 'bg-green-700 hover:bg-green-600'}
                      border-none text-white
                    `}
                    onClick={handleShowMore}
                    disabled={isLoading}
                  >
                    {isLoading 
                      ? "Loading..." 
                      : displayCount === 10 
                        ? "Show All Rankings (1-100)" 
                        : "Show Top 10 Only"}
                  </Button>
                </div>
                
                {/* Display count info */}
                <div className="text-center text-gray-400 text-sm mb-4">
                  Showing {scores.length} player{scores.length !== 1 ? 's' : ''}
                </div>
              </>
            )}
          </TabsContent>
          
          <TabsContent value="archives" className="pt-4">
            {isArchiveLoading ? (
              <div className="flex justify-center my-10">
                <div className="w-8 h-8 border-4 border-green-500 rounded-full border-t-transparent animate-spin"></div>
              </div>
            ) : archiveError ? (
              <div className="text-red-400 text-center my-10">{archiveError}</div>
            ) : archives.length === 0 ? (
              <div className="text-gray-400 text-center my-10">No archived leaderboards yet</div>
            ) : (
              <div className="space-y-8">
                {archives.map((archive) => (
                  <div key={archive.id} className="mb-8">
                    <h3 className="text-lg font-bold text-white mb-3">
                      Week {archive.weekNumber}, {archive.year}
                      <span className="text-sm font-normal text-gray-400 ml-2">
                        (Archived on {formatDate(archive.date)})
                      </span>
                    </h3>
                    {renderLeaderboard(archive.scores.slice(0, 10))}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default LeaderboardScreen;