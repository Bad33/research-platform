{/* RIGHT COLUMN: Sticky Visualizations & Q&A */}
          <aside className="lg:col-span-5 space-y-6 lg:sticky lg:top-20">
            
            {/* Dynamic Chart Card */}
            <div className="rounded-xl border border-zinc-200/80 bg-white p-5 shadow-sm">
              <div className="mb-4">
                <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Quantitative Analysis</span>
                </div>
                <h3 className="text-sm font-semibold text-zinc-900 mt-1">
                  {paper?.chart_data_json?.chart_title || 'Extracted Metrics'}
                </h3>
              </div>

              <div className="h-56 w-full text-xs">
                {paper?.chart_data_json?.data_points?.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    {paper.chart_data_json.chart_type === 'line' ? (
                      <LineChart data={paper.chart_data_json.data_points} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: '#e2e8f0' }} tick={{ fill: '#64748b' }} interval={0} angle={-15} textAnchor="end" />
                        <YAxis tickLine={false} axisLine={{ stroke: '#e2e8f0' }} tick={{ fill: '#64748b' }} />
                        <Tooltip contentStyle={{ backgroundColor: '#18181b', borderRadius: '8px', color: '#fff', border: 'none' }} />
                        <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, fill: '#2563eb' }} />
                      </LineChart>
                    ) : paper.chart_data_json.chart_type === 'pie' ? (
                      <PieChart>
                        <Pie data={paper.chart_data_json.data_points} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={80}>
                          {paper.chart_data_json.data_points.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd'][index % 4]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#18181b', borderRadius: '8px', color: '#fff', border: 'none' }} />
                      </PieChart>
                    ) : (
                      <BarChart data={paper.chart_data_json.data_points} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: '#e2e8f0' }} tick={{ fill: '#64748b' }} interval={0} angle={-15} textAnchor="end" />
                        <YAxis tickLine={false} axisLine={{ stroke: '#e2e8f0' }} tick={{ fill: '#64748b' }} />
                        <Tooltip contentStyle={{ backgroundColor: '#18181b', borderRadius: '8px', color: '#fff', border: 'none' }} />
                        <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-zinc-400">No chart data extracted.</div>
                )}
              </div>
            </div>

            {/* Methodological Rigor & GitHub Section */}
            {(paper?.limitations_and_biases || paper?.github_repo_link) && (
              <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-5 shadow-sm space-y-4">
                {paper?.limitations_and_biases && (
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-rose-700 mb-2">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Study Limitations</span>
                    </div>
                    <p className="text-sm text-zinc-700 leading-relaxed">
                      {paper.limitations_and_biases}
                    </p>
                  </div>
                )}
                {paper?.github_repo_link && (
                  <div className="pt-3 border-t border-rose-100">
                    <a href={paper.github_repo_link} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm font-medium text-zinc-900 hover:text-blue-600 transition">
                      <Github className="w-4 h-4" />
                      View Official Code Repository
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Interrogation Box (Ready for Phase 3) */}
            <div className="rounded-xl border border-zinc-200/80 bg-white p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Interrogate Findings</span>
              </div>
              <p className="text-xs text-zinc-600">
                Ask questions regarding methodology, cohort sizing, or statistical models.
              </p>
              <div className="relative flex items-center">
                <input 
                  type="text"
                  placeholder="e.g., What was the control arm?"
                  className="w-full text-xs pl-3 pr-10 py-2.5 rounded-lg border border-zinc-200 bg-zinc-50/50 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-950 focus:bg-white transition"
                />
                <button aria-label="Submit question" className="absolute right-1.5 p-1.5 rounded-md bg-zinc-900 text-white hover:bg-zinc-800 transition">
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

          </aside>
