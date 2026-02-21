-- =============================================================================
-- TalentSecure AI — Question Bank Migration
-- =============================================================================
-- Creates the question_bank table for an enterprise-grade test library holding
-- thousands of technical and cognitive questions.
--
-- Idempotent — safe to run on an existing database.
-- =============================================================================

-- ── ENUM: question_category ──────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'question_category') THEN
    CREATE TYPE question_category AS ENUM (
      'reasoning',
      'maths',
      'aptitude',
      'data_structures',
      'programming'
    );
  END IF;
END $$;

-- ── ENUM: question_type ──────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'question_type') THEN
    CREATE TYPE question_type AS ENUM (
      'multiple_choice',
      'coding_challenge'
    );
  END IF;
END $$;

-- ── ENUM: difficulty_level ───────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'difficulty_level') THEN
    CREATE TYPE difficulty_level AS ENUM (
      'easy',
      'medium',
      'hard'
    );
  END IF;
END $$;

-- =============================================================================
-- 6. question_bank
-- =============================================================================

CREATE TABLE IF NOT EXISTS question_bank (
    -- ── Identity ─────────────────────────────────────────────────────────────
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- ── Classification ───────────────────────────────────────────────────────
    category          question_category  NOT NULL,
    type              question_type      NOT NULL,
    difficulty_level  difficulty_level   NOT NULL,

    -- ── Content ──────────────────────────────────────────────────────────────
    question_text     TEXT               NOT NULL,

    -- ── MCQ-specific (NULL for coding challenges) ────────────────────────────
    -- JSONB array of option strings: ["Option A", "Option B", "Option C", "Option D"]
    options           JSONB,

    -- Correct answer: for MCQ it is the 0-based index (stored as text so it
    -- also works for coding problems where this can hold a short expected output).
    correct_answer    TEXT,

    -- ── Coding-challenge-specific (NULL for MCQs) ────────────────────────────
    -- JSONB array of test-case objects:
    -- [
    --   { "input": "4\n2 7 11 15\n9", "expectedOutput": "0 1", "hidden": false },
    --   { "input": "3\n3 2 4\n6",     "expectedOutput": "1 2", "hidden": true  }
    -- ]
    test_cases        JSONB,

    -- Starter code templates per language:
    -- { "python": "def solve(...):\n  pass", "java": "...", "cpp": "..." }
    starter_code      JSONB,

    -- Execution constraints for coding challenges
    time_limit_ms     INT               DEFAULT 5000,
    memory_limit_kb   INT               DEFAULT 262144,

    -- ── Metadata ─────────────────────────────────────────────────────────────
    marks             NUMERIC(5,2)      NOT NULL DEFAULT 5.00,
    tags              TEXT[]             DEFAULT '{}',  -- e.g. {"arrays","hash-map","two-pointer"}
    explanation       TEXT,                             -- answer explanation / editorial
    created_by        UUID              REFERENCES users(id) ON DELETE SET NULL,
    is_active         BOOLEAN           NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ       NOT NULL DEFAULT NOW(),

    -- ── Constraints ──────────────────────────────────────────────────────────
    -- MCQs MUST have options and a correct_answer
    CONSTRAINT chk_mcq_has_options CHECK (
        type != 'multiple_choice' OR (options IS NOT NULL AND correct_answer IS NOT NULL)
    ),
    -- Coding challenges MUST have at least one test case
    CONSTRAINT chk_coding_has_tests CHECK (
        type != 'coding_challenge' OR (test_cases IS NOT NULL AND jsonb_array_length(test_cases) > 0)
    ),
    -- Options must be a JSON array with ≥ 2 items when present
    CONSTRAINT chk_options_array CHECK (
        options IS NULL OR (jsonb_typeof(options) = 'array' AND jsonb_array_length(options) >= 2)
    ),
    -- Test cases must be a JSON array when present
    CONSTRAINT chk_test_cases_array CHECK (
        test_cases IS NULL OR jsonb_typeof(test_cases) = 'array'
    )
);

-- ── Indexes for fast filtering (enterprise-scale query patterns) ─────────────

CREATE INDEX IF NOT EXISTS idx_qb_category          ON question_bank (category);
CREATE INDEX IF NOT EXISTS idx_qb_type              ON question_bank (type);
CREATE INDEX IF NOT EXISTS idx_qb_difficulty         ON question_bank (difficulty_level);
CREATE INDEX IF NOT EXISTS idx_qb_category_type      ON question_bank (category, type);
CREATE INDEX IF NOT EXISTS idx_qb_category_difficulty ON question_bank (category, difficulty_level);
CREATE INDEX IF NOT EXISTS idx_qb_active             ON question_bank (is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_qb_tags               ON question_bank USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_qb_created_by         ON question_bank (created_by);

-- Full-text search on question_text (for admin search UI)
CREATE INDEX IF NOT EXISTS idx_qb_question_fts
    ON question_bank USING GIN (to_tsvector('english', question_text));

-- ── Auto-update trigger ──────────────────────────────────────────────────────

-- Reuse the existing update_updated_at() function from 01-schema.sql
CREATE TRIGGER trg_question_bank_updated_at
    BEFORE UPDATE ON question_bank
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- Seed: 25 sample questions across all 5 categories
-- =============================================================================

INSERT INTO question_bank (category, type, difficulty_level, question_text, options, correct_answer, test_cases, starter_code, marks, tags, explanation)
VALUES

-- ─────────────────────────────────────────────────────────────────────────────
-- REASONING — MCQs
-- ─────────────────────────────────────────────────────────────────────────────
(
  'reasoning', 'multiple_choice', 'easy',
  'If all roses are flowers and some flowers fade quickly, which statement must be true?',
  '["All roses fade quickly", "Some roses may fade quickly", "No roses fade quickly", "Roses are not flowers"]',
  '1',
  NULL, NULL, 5.00,
  '{logical-reasoning,syllogism}',
  'Since some flowers fade quickly and all roses are flowers, it is possible (but not certain) that some roses fade quickly.'
),
(
  'reasoning', 'multiple_choice', 'medium',
  'A is the father of B. B is the sister of C. D is the mother of C. What is D''s relationship to A?',
  '["Wife", "Sister", "Mother", "Daughter"]',
  '0',
  NULL, NULL, 10.00,
  '{blood-relations,family-tree}',
  'B and C share the same mother D. Since A is the father of B, A and D are husband and wife.'
),
(
  'reasoning', 'multiple_choice', 'hard',
  'In a certain code language, COMPUTER is written as RFUVQNPC. How is PRINTER written in that code?',
  '["QSJOUFQ", "SIRTNEP", "SFUOJSQ", "QSHOUFS"]',
  '2',
  NULL, NULL, 15.00,
  '{coding-decoding,cipher}',
  'Each letter is shifted and reversed. Applying the pattern yields SFUOJSQ.'
),

-- ─────────────────────────────────────────────────────────────────────────────
-- MATHS — MCQs
-- ─────────────────────────────────────────────────────────────────────────────
(
  'maths', 'multiple_choice', 'easy',
  'What is the value of 15% of 200?',
  '["20", "25", "30", "35"]',
  '2',
  NULL, NULL, 5.00,
  '{percentage,arithmetic}',
  '15/100 × 200 = 30.'
),
(
  'maths', 'multiple_choice', 'medium',
  'If log₁₀(x) = 3, what is the value of x?',
  '["30", "100", "1000", "10000"]',
  '2',
  NULL, NULL, 10.00,
  '{logarithm,algebra}',
  'log₁₀(x) = 3 implies x = 10³ = 1000.'
),
(
  'maths', 'multiple_choice', 'hard',
  'The sum of the first n terms of the series 1² + 2² + 3² + ... is given by n(n+1)(2n+1)/6. What is the sum of the first 10 terms?',
  '["330", "385", "400", "455"]',
  '1',
  NULL, NULL, 15.00,
  '{series,summation,algebra}',
  '10 × 11 × 21 / 6 = 385.'
),

-- ─────────────────────────────────────────────────────────────────────────────
-- APTITUDE — MCQs
-- ─────────────────────────────────────────────────────────────────────────────
(
  'aptitude', 'multiple_choice', 'easy',
  'A train 150m long passes a pole in 15 seconds. What is the speed of the train in km/h?',
  '["30", "36", "40", "45"]',
  '1',
  NULL, NULL, 5.00,
  '{speed,time,distance}',
  'Speed = 150/15 = 10 m/s = 10 × 3.6 = 36 km/h.'
),
(
  'aptitude', 'multiple_choice', 'medium',
  'A and B together can finish a job in 12 days. A alone can finish it in 20 days. How many days does B alone take?',
  '["25", "28", "30", "35"]',
  '2',
  NULL, NULL, 10.00,
  '{work,time,efficiency}',
  'B''s rate = 1/12 − 1/20 = (5−3)/60 = 1/30. B alone takes 30 days.'
),
(
  'aptitude', 'multiple_choice', 'hard',
  'A cistern can be filled by pipe A in 4 hours, pipe B in 6 hours, and drained by pipe C in 12 hours. If all three are opened, how long to fill the cistern?',
  '["3 hours", "4 hours", "5 hours", "6 hours"]',
  '0',
  NULL, NULL, 15.00,
  '{pipes,cistern,rate}',
  'Net rate = 1/4 + 1/6 − 1/12 = 3/12 + 2/12 − 1/12 = 4/12 = 1/3. Time = 3 hours.'
),

-- ─────────────────────────────────────────────────────────────────────────────
-- DATA STRUCTURES — MCQs + Coding
-- ─────────────────────────────────────────────────────────────────────────────
(
  'data_structures', 'multiple_choice', 'easy',
  'Which data structure uses FIFO (First-In-First-Out) ordering?',
  '["Stack", "Queue", "Deque", "Heap"]',
  '1',
  NULL, NULL, 5.00,
  '{queue,fifo,basics}',
  'A Queue follows FIFO ordering.'
),
(
  'data_structures', 'multiple_choice', 'medium',
  'What is the average-case time complexity of searching in a balanced BST with n nodes?',
  '["O(1)", "O(log n)", "O(n)", "O(n log n)"]',
  '1',
  NULL, NULL, 10.00,
  '{bst,binary-search-tree,time-complexity}',
  'Balanced BST search is O(log n) on average.'
),
(
  'data_structures', 'multiple_choice', 'hard',
  'In a Red-Black tree, what is the maximum ratio of the longest path to the shortest path from root to any leaf?',
  '["1:1", "2:1", "3:1", "log n : 1"]',
  '1',
  NULL, NULL, 15.00,
  '{red-black-tree,balanced-tree,advanced}',
  'A Red-Black tree guarantees the longest path is at most twice the shortest (2:1 ratio).'
),
(
  'data_structures', 'coding_challenge', 'easy',
  'Implement a function that reverses a singly linked list and returns the new head. Read n followed by n integers, print the reversed list space-separated.',
  NULL, NULL,
  '[
    {"input": "5\n1 2 3 4 5", "expectedOutput": "5 4 3 2 1", "hidden": false},
    {"input": "3\n10 20 30",  "expectedOutput": "30 20 10",   "hidden": true},
    {"input": "1\n42",        "expectedOutput": "42",         "hidden": true}
  ]',
  '{"python": "n = int(input())\nnums = list(map(int, input().split()))\n# Reverse and print\nprint('' ''.join(map(str, nums[::-1])))\n", "java": "import java.util.*;\npublic class Main {\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    int n = sc.nextInt();\n    int[] a = new int[n];\n    for (int i = 0; i < n; i++) a[i] = sc.nextInt();\n    // Reverse and print\n    StringBuilder sb = new StringBuilder();\n    for (int i = n-1; i >= 0; i--) sb.append(a[i]).append(i > 0 ? \" \" : \"\");\n    System.out.println(sb);\n  }\n}\n", "cpp": "#include <iostream>\\n#include <vector>\\nusing namespace std;\\nint main() {\\n  int n; cin >> n;\\n  vector<int> a(n);\\n  for (int i=0;i<n;i++) cin >> a[i];\\n  for (int i=n-1;i>=0;i--) cout << a[i] << (i?\" \":\"\\n\");\\n}\\n"}',
  10.00,
  '{linked-list,reverse,basics}',
  'Iterate through the list, reversing pointers one by one. Time O(n), Space O(1).'
),
(
  'data_structures', 'coding_challenge', 'medium',
  'Given an array of integers, determine if it contains any duplicates. Read n, then n integers. Print "true" if any value appears at least twice, otherwise print "false".',
  NULL, NULL,
  '[
    {"input": "4\n1 2 3 1",      "expectedOutput": "true",  "hidden": false},
    {"input": "4\n1 2 3 4",      "expectedOutput": "false", "hidden": false},
    {"input": "5\n1 1 1 3 3",    "expectedOutput": "true",  "hidden": true},
    {"input": "1\n1",            "expectedOutput": "false", "hidden": true}
  ]',
  '{"python": "n = int(input())\nnums = list(map(int, input().split()))\n# Your solution here\nprint(str(len(nums) != len(set(nums))).lower())\n", "java": "import java.util.*;\npublic class Main {\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    int n = sc.nextInt();\n    Set<Integer> s = new HashSet<>();\n    boolean dup = false;\n    for (int i = 0; i < n; i++) { if (!s.add(sc.nextInt())) dup = true; }\n    System.out.println(dup);\n  }\n}\n", "cpp": "#include <iostream>\\n#include <unordered_set>\\nusing namespace std;\\nint main(){\\n  int n; cin>>n;\\n  unordered_set<int> s;\\n  bool dup=false;\\n  for(int i=0;i<n;i++){int x;cin>>x;if(!s.insert(x).second)dup=true;}\\n  cout<<(dup?\"true\":\"false\")<<endl;\\n}\\n"}',
  10.00,
  '{hash-set,array,duplicates}',
  'Use a hash set to track seen values. Time O(n), Space O(n).'
),

-- ─────────────────────────────────────────────────────────────────────────────
-- PROGRAMMING — MCQs + Coding
-- ─────────────────────────────────────────────────────────────────────────────
(
  'programming', 'multiple_choice', 'easy',
  'What does the keyword "static" mean in Java when applied to a method?',
  '["The method can only be called once", "The method belongs to the class, not an instance", "The method cannot be overridden", "The method runs at compile time"]',
  '1',
  NULL, NULL, 5.00,
  '{java,static,oop}',
  'A static method belongs to the class itself and can be called without creating an instance.'
),
(
  'programming', 'multiple_choice', 'medium',
  'In Python, what is the output of: print(type(lambda x: x))?',
  '["<class ''function''>", "<class ''lambda''>", "<class ''method''>", "SyntaxError"]',
  '0',
  NULL, NULL, 10.00,
  '{python,lambda,types}',
  'Lambdas are anonymous functions; their type is <class ''function''>.'
),
(
  'programming', 'multiple_choice', 'hard',
  'Which of the following correctly describes the CAP theorem in distributed systems?',
  '["A system can have Consistency, Availability, and Partition tolerance simultaneously", "A system can guarantee at most two of Consistency, Availability, and Partition tolerance", "CAP only applies to SQL databases", "Partition tolerance can always be sacrificed"]',
  '1',
  NULL, NULL, 15.00,
  '{distributed-systems,cap-theorem,system-design}',
  'The CAP theorem states that a distributed system can provide at most two out of three guarantees: Consistency, Availability, and Partition Tolerance.'
),
(
  'programming', 'coding_challenge', 'easy',
  'Write a program that reads an integer n and prints the sum of all integers from 1 to n.',
  NULL, NULL,
  '[
    {"input": "5",       "expectedOutput": "15",        "hidden": false},
    {"input": "10",      "expectedOutput": "55",        "hidden": false},
    {"input": "100",     "expectedOutput": "5050",      "hidden": true},
    {"input": "1",       "expectedOutput": "1",         "hidden": true}
  ]',
  '{"python": "n = int(input())\n# Your code here\nprint(n * (n + 1) // 2)\n", "java": "import java.util.Scanner;\npublic class Main {\n  public static void main(String[] args) {\n    int n = new Scanner(System.in).nextInt();\n    System.out.println(n * (n + 1) / 2);\n  }\n}\n", "cpp": "#include <iostream>\\nusing namespace std;\\nint main(){\\n  int n; cin>>n;\\n  cout<<n*(n+1)/2<<endl;\\n}\\n"}',
  5.00,
  '{math,summation,basics}',
  'Use the formula n(n+1)/2 for O(1) time.'
),
(
  'programming', 'coding_challenge', 'medium',
  'Given an array of integers and a target, return the indices of the two numbers that add up to the target. Read n, then n integers, then the target. Print two space-separated 0-based indices.',
  NULL, NULL,
  '[
    {"input": "4\n2 7 11 15\n9",  "expectedOutput": "0 1", "hidden": false},
    {"input": "3\n3 2 4\n6",      "expectedOutput": "1 2", "hidden": true},
    {"input": "2\n3 3\n6",        "expectedOutput": "0 1", "hidden": true}
  ]',
  '{"python": "n = int(input())\nnums = list(map(int, input().split()))\ntarget = int(input())\n# Your solution here\nlookup = {}\nfor i, v in enumerate(nums):\n    if target - v in lookup:\n        print(lookup[target-v], i)\n        break\n    lookup[v] = i\n", "java": "import java.util.*;\npublic class Main {\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    int n = sc.nextInt();\n    int[] a = new int[n];\n    for (int i=0;i<n;i++) a[i]=sc.nextInt();\n    int t = sc.nextInt();\n    Map<Integer,Integer> m = new HashMap<>();\n    for (int i=0;i<n;i++) {\n      if (m.containsKey(t-a[i])) { System.out.println(m.get(t-a[i])+\" \"+i); return; }\n      m.put(a[i],i);\n    }\n  }\n}\n", "cpp": "#include <iostream>\\n#include <unordered_map>\\nusing namespace std;\\nint main(){\\n  int n; cin>>n;\\n  vector<int> a(n);\\n  for(int i=0;i<n;i++) cin>>a[i];\\n  int t; cin>>t;\\n  unordered_map<int,int> m;\\n  for(int i=0;i<n;i++){\\n    if(m.count(t-a[i])){cout<<m[t-a[i]]<<\" \"<<i<<endl;return 0;}\\n    m[a[i]]=i;\\n  }\\n}\\n"}',
  10.00,
  '{hash-map,two-sum,array}',
  'Use a hash map for O(n) lookup. Store value→index, check complement each step.'
),
(
  'programming', 'coding_challenge', 'hard',
  'Given a string containing just the characters ''('', '')'', ''{'', ''}'', ''['' and '']'', determine if the input string is valid. A string is valid if open brackets are closed by the same type in the correct order. Read one line, print "true" or "false".',
  NULL, NULL,
  '[
    {"input": "()",       "expectedOutput": "true",  "hidden": false},
    {"input": "()[]{}" ,  "expectedOutput": "true",  "hidden": false},
    {"input": "(]",       "expectedOutput": "false", "hidden": false},
    {"input": "([)]",     "expectedOutput": "false", "hidden": true},
    {"input": "{[]}",     "expectedOutput": "true",  "hidden": true},
    {"input": "",         "expectedOutput": "true",  "hidden": true}
  ]',
  '{"python": "s = input()\nstack = []\nmapping = {\")\": \"(\", \"}\": \"{\", \"]\": \"[\"}\nfor c in s:\n    if c in mapping:\n        if not stack or stack[-1] != mapping[c]:\n            print(\"false\")\n            exit()\n        stack.pop()\n    else:\n        stack.append(c)\nprint(\"true\" if not stack else \"false\")\n", "java": "import java.util.*;\npublic class Main {\n  public static void main(String[] args) {\n    String s = new Scanner(System.in).nextLine();\n    Deque<Character> st = new ArrayDeque<>();\n    Map<Character,Character> m = Map.of('')'',''('', ''}'',''{'', '']'',''['');\n    for (char c : s.toCharArray()) {\n      if (m.containsKey(c)) { if (st.isEmpty()||st.peek()!=m.get(c)){System.out.println(false);return;} st.pop(); }\n      else st.push(c);\n    }\n    System.out.println(st.isEmpty());\n  }\n}\n", "cpp": "#include <iostream>\\n#include <stack>\\nusing namespace std;\\nint main(){\\n  string s; getline(cin,s);\\n  stack<char> st;\\n  for(char c:s){\\n    if(c==''(''||c==''[''||c==''{'' ) st.push(c);\\n    else{\\n      if(st.empty()) {cout<<\"false\";return 0;}\\n      char t=st.top(); st.pop();\\n      if((c=='')''&&t!=''('')||(c=='']''&&t!=''['') || (c==''}''&&t!=''{'')) {cout<<\"false\";return 0;}\\n    }\\n  }\\n  cout<<(st.empty()?\"true\":\"false\");\\n}\\n"}',
  15.00,
  '{stack,brackets,string,validation}',
  'Use a stack. Push opening brackets, pop and match on closing brackets. O(n) time.'
),

-- Additional filler questions for volume
(
  'reasoning', 'multiple_choice', 'easy',
  'Complete the series: 2, 6, 12, 20, 30, ?',
  '["40", "42", "44", "48"]',
  '1',
  NULL, NULL, 5.00,
  '{number-series,pattern}',
  'Differences are 4, 6, 8, 10, 12 → next term = 30 + 12 = 42.'
),
(
  'maths', 'multiple_choice', 'medium',
  'What is the determinant of the 2×2 matrix [[3, 8], [4, 6]]?',
  '["-14", "14", "-2", "50"]',
  '0',
  NULL, NULL, 10.00,
  '{matrix,determinant,linear-algebra}',
  'det = (3)(6) − (8)(4) = 18 − 32 = −14.'
),
(
  'aptitude', 'multiple_choice', 'easy',
  'A shopkeeper sells an article for ₹450 at a 10% profit. What was the cost price?',
  '["₹400", "₹405", "₹409.09", "₹500"]',
  '2',
  NULL, NULL, 5.00,
  '{profit-loss,percentage}',
  'CP = SP / 1.10 = 450 / 1.1 ≈ 409.09.'
);

-- =============================================================================
-- Verify: count of seeded rows
-- =============================================================================
-- SELECT category, type, difficulty_level, COUNT(*)
-- FROM question_bank
-- GROUP BY category, type, difficulty_level
-- ORDER BY category, type, difficulty_level;
