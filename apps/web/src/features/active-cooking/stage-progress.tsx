interface StageProgressProps {
	stageTitle: string;
	stageIndex: number;
	totalStages: number;
}

export function StageProgress({
	stageTitle,
	stageIndex,
	totalStages,
}: StageProgressProps) {
	const currentStage = stageIndex + 1;
	const percentage = (currentStage / totalStages) * 100;

	return (
		<div className="space-y-2">
			<div className="flex items-end justify-between gap-3">
				<div className="min-w-0">
					<p className="text-xs font-extrabold tracking-wide text-muted-foreground uppercase">
						Stage {currentStage} of {totalStages}
					</p>
					<p className="truncate text-sm font-extrabold">{stageTitle}</p>
				</div>
				<span className="shrink-0 text-xs font-bold text-muted-foreground">
					{Math.round(percentage)}%
				</span>
			</div>
			<div
				className="h-2 overflow-hidden rounded-full border border-foreground bg-muted"
				role="progressbar"
				aria-label="Cooking stage progress"
				aria-valuemin={1}
				aria-valuemax={totalStages}
				aria-valuenow={currentStage}
			>
				<div
					className="h-full bg-primary"
					style={{ width: `${percentage}%` }}
				/>
			</div>
		</div>
	);
}
