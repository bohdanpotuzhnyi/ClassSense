## Student UI: buttons vs. sliders

A paired-samples t-test showed no statistically significant difference in perceived usability between the button interface 
(M = 3.76, SD = 1.13) and the slider interface (M = 3.68, SD = 1.00), $t(25) = 0.46$, $p = 0.65$. 
Because disruption ratings were not normally distributed, a Wilcoxon matched-pairs signed-rank test was applied, 
revealing no significant difference between buttons (M = 3.60, SD = 1.02) and sliders (M = 3.23, SD = 1.21), $p = .152$. 
Figure \ref{fig:student-usability} and Figure \ref{fig:student-disruption} summarise the mean ratings and standard deviations for both measures.

\begin{figure}[htbp]
\centering
\begin{minipage}{0.48\textwidth}
\centering
\includegraphics[width=\linewidth]{images/mean-std-usability-student}
\caption{Mean and standard deviation of student usability ratings (buttons vs.\ sliders).}
\label{fig:student-usability}
\end{minipage}\hfill
\begin{minipage}{0.48\textwidth}
\centering
\includegraphics[width=\linewidth]{images/mean-std-disruption-student}
\caption{Mean and standard deviation of perceived disruption during class (buttons vs.\ sliders).}
\label{fig:student-disruption}
\end{minipage}
\end{figure}

Adoption intention did not differ significantly between the button interface (M = 3.69, SD = 1.03) and the slider interface 
(M = 3.54, SD = 0.98), as indicated by a Wilcoxon matched-pairs signed-rank test ($p = .34$). In contrast, 
reaction-time data revealed a clear efficiency advantage for buttons. Because distributions were non-normal and 
observation counts differed between conditions (buttons: $n = 516$, sliders: $n = 89$), a Mann--Whitney $U$ test was applied. 
Students responded significantly faster using buttons (median $= 80$\,ms) than sliders (median $= 514$\,ms), $U = 11576$, $p < 0.0001$. 
Figure\ref{fig:student-adoption} and Figure\ref{fig:student-reaction} illustrate the mean values and standard deviations for both measures.

\begin{figure}[htbp]
\centering
\begin{minipage}{0.48\textwidth}
\centering
\includegraphics[width=\linewidth]{images/mean-std-adoption-student}
\caption{Mean and standard deviation of student adoption intention (buttons vs.\ sliders).}
\label{fig:student-adoption}
\end{minipage}\hfill
\begin{minipage}{0.48\textwidth}
\centering
\includegraphics[width=\linewidth]{images/mean-std-reaction-student}
\caption{Mean and standard deviation of reaction time for student feedback (buttons vs.\ sliders).}
\label{fig:student-reaction}
\end{minipage}
\end{figure}

### Preference

Despite similar Likert ratings, forced choice showed a clear preference: 19/26 students preferred buttons (binomial test p = 0.040). 
Button supporters described the interaction as faster and less distracting, while slider supporters valued precision.

## Teacher dashboard: browser vs. external screen

Teachers reported high usability for both dashboard configurations. A paired-samples t-test showed no statistically 
significant difference between the browser dashboard (M = 4.21, SD = 0.86) and the external-screen dashboard (M = 4.64, SD = 0.38), 
$t(6) = 1.35$, $p = 0.225$. Practicality and perceived disruption were likewise comparable across conditions. Using a Wilcoxon 
matched-pairs signed-rank test, no significant difference was found between the browser version (M = 3.71, SD = 0.76) and the 
external-screen version (M = 4.43, SD = 0.53), $p = 0.25$. Figure \ref{fig:teacher-usability} and Figure \ref{fig:teacher-disruption} 
summarise the mean ratings and standard deviations for both measures.

\begin{figure}[htbp]
\centering
\begin{minipage}{0.48\textwidth}
\centering
\includegraphics[width=\linewidth]{images/mean-std-usability-teacher}
\caption{Mean and standard deviation of teacher usability ratings (browser vs.\ external screen).}
\label{fig:teacher-usability}
\end{minipage}\hfill
\begin{minipage}{0.48\textwidth}
\centering
\includegraphics[width=\linewidth]{images/mean-std-disruption-teacher}
\caption{Mean and standard deviation of teacher practicality/disruption ratings (browser vs.\ external screen).}
\label{fig:teacher-disruption}
\end{minipage}
\end{figure}


### Adoption intention

Adoption intention also showed no significant difference (Wilcoxon, p = 0.25), but the external screen trended higher: browser (M = 3.86, SD = 0.63) vs. external screen (M = 4.36, SD = 0.48).

![Mean and STD for adoption intention (A = browser, B = external screen).](../images/mean-std-adoption-teacher.png){ width=50% }

### Preference

Forced choice revealed a strong preference: 6/7 teachers chose the external-screen dashboard. Teachers reported that an additional screen avoids window switching, keeps teaching materials visible, and supports continuous peripheral awareness.

## Discussion and implications

Across both groups, the dominant theme was *low effort + high trust*. Students reacted significantly faster with one-tap buttons, supporting the central design principle that in-class feedback must be nearly effortless [@fitts1954information]. Teachers preferred the external-screen setup because it integrates better with real teaching flow and reduces disruptions from task switching [@czerwinski2004diary].

Overall, ClassSense appears feasible and desirable in a BYOD secondary school context—provided it remains anonymous, aggregated, and calm in its visual behaviour.

## Limitations and next steps

- Sample sizes were modest (n = 26 students, n = 7 teachers), and sessions were short, limiting generalisability and long-term adoption claims.
- The evaluation focused on UI comparison; longer deployments are needed to assess habituation effects and real classroom impact.
- Future iterations should refine accessibility beyond colour choices (icons, text alternatives) and evaluate whether environment indicators meaningfully improve teaching decisions.

# Retrospective

Firstly, in the early phase, we considered approaches such as app usage tracking and camera-based emotion detection. 
However, these ideas were strongly rejected by students in the exploratory study. The original intention of this idea 
was privacy-driven, and it would not collect more data than what students already share when they 
tap a button. However, this was not made clear enough in our introduction. Questions could have been framed more 
carefully to avoid creating the impression of surveillance. Secondly, the interview phase could have been extended to 
include multiple rounds. If there had been more time, an additional round of interviews after the first prototype 
refinement would have helped to validate whether the early design interpretations (e.g., the four core states, the 
calm visual style, and the additional teacher view) truly matched real classroom expectations, before moving on to 
the controlled experiment. Thirdly, the technical architecture was designed to be functional and lightweight within 
the course timeline. With more development time, the backend and data pipeline could have been improved for
more stable classroom use. Overall, these points do not change the general direction of the project. However, 
we present them to show where the process could be strengthened.