---
title: "**ClassSense:** Web-App for Classroom Climate and Focus Awareness "
author:
  - Bohdan Potuzhnyi
  - Vlada Svirsh
  - Samuel Schaffhauser
date: "Semester A2025"
subject: "Project report"
toc: false
toc-own-page: true
toc-depth: 2
lof: false
nocite: '@*'
link-citations: true
numbersections: true
geometry:
  - margin=2.3cm
header-includes:
- \usepackage{graphicx}
- \usepackage{svg}
- \usepackage{amsmath}
- \usepackage{hyperref}
- \usepackage{float}
- \usepackage{microtype}
- \usepackage{caption}
- \captionsetup{font=small,labelfont=bf,skip=4pt}
- \usepackage{enumitem}
- \setlist{nosep,leftmargin=*}
- \setlength{\textfloatsep}{10pt plus 2pt minus 2pt}
- \setlength{\floatsep}{8pt plus 2pt minus 2pt}
- \setlength{\intextsep}{8pt plus 2pt minus 2pt}
- \setlength{\parindent}{1.2em}
- \setlength{\parskip}{0pt}
- \newcommand{\thesistitle}{ClassSense}
- \newcommand{\thesissubtitle}{Web-App for Classroom Climate and Focus Awareness}
- \newcommand{\thesisauthor}{Bohdan Potuzhnyi\\Vlada Svirsh\\Samuel Schaffhauser}
- \newcommand{\thesisdate}{Semester A2025}
mainfont: SFProText
sansfont: SFPro
monofont: SFMono
---

\begin{titlepage}
  \begin{center}

  \begin{figure}[t]
  \vspace*{-2cm}        % to move header logo at the top
  \center{\includegraphics[scale=0.2]{images/mcs.png}}
  \vspace{0.4in}
  \end{figure}

    \thispagestyle{empty}

    \LARGE{Project Report \\}

    {\bfseries\Huge \thesistitle \par}
    {\Large \vspace{0.1in} \thesissubtitle \par}

    \vspace{0.3in}
    
    \vspace{0.4in}
    {\Large submitted by \par}
    {\Large \thesisauthor\par}

    \vspace{0.3in}
    {\Large submitted to \par}
    {\Large Department of Informatics at the University of Fribourg \par}
    {\Large User Centered Design \par}
    {\Large Prof. Dr. Denis Lalanne \par}

    \vfill
    {\Large \thesisdate \par}

  \vspace{0.9in}

  % === Logos ==============================================
  \begin{figure}[htp]
    \centering
    \includegraphics[scale=0.30]{images/unibe.png}\hfill
    \includegraphics[scale=0.30]{images/unine.png}\hfill
    \includegraphics[scale=0.80]{images/unifr.png}
  \end{figure}
  % === // Logos ===========================================

  \end{center}

\end{titlepage}
\clearpage
\setcounter{tocdepth}{2}
\tableofcontents


\newpage

# **Introduction**
!include chapters/1_introduction.md



# **Exploratory study**
!include chapters/2_exploratory.md



# **Personas and scenarios**
!include chapters/3_personas.md



# **Design choices and design rationale**
!include chapters/4_design_rationale.md


# **Low-fidelity prototype**
!include chapters/5_lowfi_prototype.md



# **Controlled evaluation**
!include chapters/6_evaluation_plan.md


# **Analysis of evaluation results**
!include chapters/8_results_analysis.md


# **References** {-}

::: {#refs}
:::
