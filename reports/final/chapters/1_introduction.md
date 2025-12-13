## Background

Swiss high schools (Gymnasien) are undergoing a significant transformation through the reform “Weiterentwicklung der 
gymnasialen Maturität” (WEGM).
The reform emphasizes digital competence, media literacy, and self-regulated learning.
As digital devices become integral to everyday teaching, teachers face new challenges: maintaining attention, managing 
distractions, and supporting students’ emotional and cognitive well-being.
ClassSense aims to address these needs with a user-centered web application that enables both teachers and students to 
monitor and co-regulate classroom climate in real time, respecting privacy and autonomy.
These priorities align with broader trends in Swiss education policy, which emphasize wellbeing, autonomy, and 
sustainable learning environments.

## Problem

Swiss high schools actively integrate laptops, tablets, and other electronic tools into the curriculum, 
classrooms are more lively but also more distracted.
While digitalization releases creativity and the potential of information, it simultaneously makes it harder for 
teachers to get the class coordinated in concentration, interest, and emotional self-regulation.
Researchers suggest that emotional classroom climate is a strong predictor of pupil engagement and 
performance [@brackett2011classroom; @wang2020classroom].
Yet most schools still rely on the teacher's unassisted intuition to sense when attention is getting smaller.
The WEGM approach underscores the need for privacy-respecting feedback instruments rather than invasive 
monitoring instruments.
Teachers and students need a simple-to-use, privacy-respecting instrument for monitoring, understanding, 
and modulating class mood and focus in real time.

## Goals

The development of ClassSense was driven by a set of functional and ethical design goals, with the objective of 
ensuring its suitability for everyday school use.
The system was developed for the purpose of providing teachers with a real-time overview of the classroom climate 
by displaying an anonymous, aggregated distribution of student states (e.g., understood, confused, overloaded, tired).
Feedback is refreshed within a few seconds, thereby enabling timely pedagogical decisions and supporting the link 
between emotional climate and engagement [@reyes2012classroom; @brackett2011classroom]. 
Privacy-by-design is a core architectural principle of ClassSense.
Students can send feedback without any form of login or identification.
The system is designed to work without collection/storage of any personal identifiers.
To support transparency, the project is done under the AGPL license.
Finally, the additional workload for teachers must remain minimal.

## Methodological approach

To ensure that ClassSense fits real classroom needs, we followed the Design Process Model showcased during User-Centered 
Design (UCD) led by D. Lalanne at the University of Fribourg.
The project was structured around four iterative phases: Articulate, Brainstorm, Refine, Complete.
