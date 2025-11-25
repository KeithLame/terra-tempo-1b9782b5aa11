'use client';

export default function KnowledgeBasePage() {
  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">
        Community Knowledge Base
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Browse agricultural best practices, expert guidance, and community insights
      </p>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { title: 'Wheat Farming Best Practices', category: 'Wheat', votes: 45 },
          { title: 'Optimizing Irrigation Systems', category: 'Water Management', votes: 38 },
          { title: 'Organic Fertilizer Guide', category: 'Soil Health', votes: 52 },
          { title: 'Pest Control Strategies', category: 'Crop Protection', votes: 41 },
          { title: 'Seasonal Planting Calendar', category: 'Planning', votes: 67 },
          { title: 'Corn Yield Optimization', category: 'Corn', votes: 33 },
        ].map((article, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-card p-6">
            <div className="text-sm text-primary dark:text-primary-dark font-semibold mb-2">
              {article.category}
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
              {article.title}
            </h3>
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>👍 {article.votes} helpful</span>
              <button className="text-primary dark:text-primary-dark hover:underline">
                Read More
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


