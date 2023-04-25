using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System.Linq;
using UnityEngine.UI;
using UnityEditor;
using Unity.VisualScripting;
using TMPro;
using UnityEngine.SceneManagement;
public class PrimaryDebateQuestions : MonoBehaviour
{
    public GameObject prefab;
    public int numIssues = 5;
    public HashSet<int> hs = new HashSet<int>();
    public TextAsset txt;
    public List<GameObject> candidates;
    public List<GameObject> objectsToDestroy;
    public GameObject yesText;
    public GameObject noText;
    public GameObject instance;
    public int[] values;
    public List<string> lines;
    public int n;
    public int counter = 0;
    public List<GameObject> objectsToActivate;
    public List<GameObject> objectsToDeactivate;
    public float correctAnswerShare = 0.75f;
    public float rivalMod = 1f;

    // Start is called before the first frame update
    IEnumerator waiter()
    {
        yield return new WaitForSecondsRealtime(3);
    }
    
    void Start()
    {
        int diff = (int)Variables.Saved.Get("difficultyLevel");
        rivalMod *= (diff + 0.5f);
        TextAsset txt = (TextAsset)Resources.Load("DebateQuestions", typeof(TextAsset));
        lines = (txt.text.Split('\n').ToList());
        n = lines.Count();
    }

    void OnEnable() 
    {
        TextAsset txt = (TextAsset)Resources.Load("DebateQuestions", typeof(TextAsset));
        lines = (txt.text.Split('\n').ToList());
        n = lines.Count();
        float rival1 = (float)Variables.Saved.Get("p_rival1");
        float rival2 = (float)Variables.Saved.Get("p_rival2");
        float rival3 = (float)Variables.Saved.Get("p_rival3");
        float rival4 = (float)Variables.Saved.Get("p_rival4");
        bool partyType = (bool)Variables.Saved.Get("Democrats");
        int rivalAnswerMod = 0;
        if (partyType)
        {
            rivalAnswerMod = 1;
        }
        else
        {
            rivalAnswerMod = 1;
        }
        List<float> candRatings = new List<float>();
        candRatings.Add(rival1);
        candRatings.Add(rival2);
        candRatings.Add(rival3);
        candRatings.Add(rival4);
        List<int> candAnswers = new List<int>();

        if (counter < numIssues)
        {
            int r = Random.Range(0, n-1);
            while (hs.Contains(r)) 
            {
                r = Random.Range(0, n-1);
            }
            hs.Add(r);
            List<string> l = new List<string>(lines[r].Split('\t').ToList());
            float liberal = (float.Parse(l[1])/1f);
            float libertarian = (float.Parse(l[2])/1f);
            float owner = (float.Parse(l[3])/1f);
            float worker = (float.Parse(l[4])/1f);
            float religious = (float.Parse(l[5])/1f);
            float immigrant = (float.Parse(l[6])/1f);
            foreach(GameObject g in candidates)
            {
                float rnum = Random.value;
                if (rnum < correctAnswerShare)
                {
                    if (partyType && (float.Parse(l[1])) >= 0) 
                    {
                        instance = Instantiate(yesText, g.transform);
                        objectsToDestroy.Add(instance);
                        candAnswers.Add(1);
                    }
                    else if (partyType)
                    {
                        instance = Instantiate(noText, g.transform);
                        objectsToDestroy.Add(instance);
                        candAnswers.Add(-1);
                    }
                    else if (!partyType && (float.Parse(l[3])) >= 0)
                    {
                        instance = Instantiate(yesText, g.transform);
                        objectsToDestroy.Add(instance);
                        candAnswers.Add(1);
                    }
                    else
                    {
                        instance = Instantiate(noText, g.transform);
                        objectsToDestroy.Add(instance);
                        candAnswers.Add(-1);
                    }
                }
                else
                {
                    if (partyType && (float.Parse(l[1])) >= 0) 
                    {
                        instance = Instantiate(noText, g.transform);
                        objectsToDestroy.Add(instance);
                        candAnswers.Add(-1);
                    }
                    else if (partyType)
                    {
                        instance = Instantiate(yesText, g.transform);
                        objectsToDestroy.Add(instance);
                        candAnswers.Add(1);
                    }
                    else if (!partyType && (float.Parse(l[3])) >= 0)
                    {
                        instance = Instantiate(noText, g.transform);
                        objectsToDestroy.Add(instance);
                        candAnswers.Add(-1);
                    }
                    else
                    {
                        instance = Instantiate(yesText, g.transform);
                        objectsToDestroy.Add(instance);
                        candAnswers.Add(1);
                    }
                }
            }
            for (int i = 0; i < candAnswers.Count(); i++)
            {
                if (partyType)
                {
                    candRatings[i] = candRatings[i] + ((float.Parse(l[1])/1f)*candAnswers[i]*rivalAnswerMod*rivalMod);
                }
                else
                {
                    candRatings[i] = candRatings[i] + ((float.Parse(l[3])/1f)*candAnswers[i]*rivalAnswerMod*rivalMod);
                }
            }
            Variables.Saved.Set("p_rival1", candRatings[0]);
            Variables.Saved.Set("p_rival2", candRatings[1]);
            Variables.Saved.Set("p_rival3", candRatings[2]);
            Variables.Saved.Set("p_rival4", candRatings[3]);
            instance = Instantiate(prefab, transform);
            instance.GetComponentInChildren<TextMeshProUGUI>().text = l[0];
            instance.GetComponent<DebateQuestion>().liberal = liberal;
            instance.GetComponent<DebateQuestion>().libertarian = libertarian;
            instance.GetComponent<DebateQuestion>().immigrant = immigrant;
            instance.GetComponent<DebateQuestion>().owner = owner;
            instance.GetComponent<DebateQuestion>().worker = worker;
            instance.GetComponent<DebateQuestion>().religious = religious;
            counter++;
        }
        else
        {
            foreach (GameObject g in objectsToActivate)
            {
                g.SetActive(true);
            }
            foreach (GameObject g in objectsToDeactivate)
            {
                g.SetActive(false);
            }
            //SceneManager.LoadScene(3, LoadSceneMode.Single);
        }
    }

    void OnDisable()
    {
        foreach (GameObject g in objectsToDestroy)
        {
            Destroy(g);
        }
    }

    // Update is called once per frame
    void Update()
    {
        
    }

    
}
